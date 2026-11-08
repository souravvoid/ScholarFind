import { Link } from 'react-router-dom';
import { Container } from '../components/ui/Container';
import { EmptyState } from '../components/ui/EmptyState';
import { buttonStyles } from '../components/ui/Button';

export function NotFoundPage() {
  return (
    <Container className="py-16">
      <EmptyState
        icon="explore"
        title="This page doesn't exist"
        description="The link may be outdated. Everything ScholarFind indexes is available from the catalogue."
        action={
          <Link to="/explore" className={buttonStyles({ variant: 'primary' })}>
            Go to the catalogue
          </Link>
        }
      />
    </Container>
  );
}
