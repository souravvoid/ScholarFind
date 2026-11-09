"""Populate PostgreSQL from the verified scholarship source adapters.

The original FastAPI service kept adapter output in memory, so there is no
existing FastAPI database to copy. The adapter registry is the source of truth.
This command runs every adapter through the ingestion pipeline and idempotently
upserts the normalized records into the Django catalogue tables.
"""

import json

from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone

from ingestion.pipeline import IngestionPipeline, IngestionStorageRepository
from ingestion.registry import PIPELINE_ADAPTERS, get_pipeline_adapter
from scholarships.models import IngestionJob, Scholarship, ScholarshipSource
from scholarships.services import persist_records, records_for_source

SUCCESS_STATUSES = {"success", "completed_with_warnings"}


class Command(BaseCommand):
    help = "Seed the scholarship catalogue from all verified adapters."

    def add_arguments(self, parser):
        parser.add_argument(
            "--source",
            action="append",
            dest="sources",
            help="Only run the given source id (repeatable).",
        )
        parser.add_argument(
            "--reset",
            action="store_true",
            help="Delete existing scholarships and sources before populating.",
        )

    def handle(self, *args, **options):
        source_ids = options["sources"] or list(PIPELINE_ADAPTERS)
        unknown = [source for source in source_ids if source not in PIPELINE_ADAPTERS]
        if unknown:
            raise CommandError(
                "Unknown source id(s): "
                + ", ".join(unknown)
                + ". Valid: "
                + ", ".join(PIPELINE_ADAPTERS)
            )

        if options["reset"]:
            deleted_scholarships, _ = Scholarship.objects.all().delete()
            deleted_sources, _ = ScholarshipSource.objects.all().delete()
            self.stdout.write(
                f"Reset: removed {deleted_scholarships} scholarships and "
                f"{deleted_sources} sources."
            )

        created_total = 0
        updated_total = 0
        failed_sources = []

        for source_id in source_ids:
            adapter = get_pipeline_adapter(source_id)
            job = IngestionJob.objects.create(
                source_id=source_id, status=IngestionJob.StatusChoices.RUNNING
            )

            storage = IngestionStorageRepository()
            pipeline = IngestionPipeline(
                source_id=source_id, adapter_instance=adapter, storage=storage
            )
            result = pipeline.run_job()
            records = records_for_source(storage, source_id)
            created, updated = persist_records(records)

            created_total += created
            updated_total += updated
            succeeded = result["status"] in SUCCESS_STATUSES
            if not succeeded:
                failed_sources.append(source_id)

            job.status = (
                IngestionJob.StatusChoices.COMPLETED
                if succeeded
                else IngestionJob.StatusChoices.FAILED
            )
            job.records_fetched = result.get("records_fetched", 0)
            job.records_upserted = created + updated
            job.records_failed = len(result.get("errors", []))
            job.error_log = json.dumps(result.get("errors", []))
            job.completed_at = timezone.now()
            job.save()

            self.stdout.write(
                f"{source_id}: {result['status']} "
                f"fetched={result.get('records_fetched', 0)} "
                f"created={created} updated={updated} "
                f"errors={len(result.get('errors', []))}"
            )

        self.stdout.write(
            self.style.SUCCESS(
                f"Population complete: created={created_total} updated={updated_total} "
                f"catalogue_total={Scholarship.objects.count()} "
                f"sources={ScholarshipSource.objects.count()}"
            )
        )
        if failed_sources:
            raise CommandError(
                "Some sources failed: " + ", ".join(failed_sources)
            )
