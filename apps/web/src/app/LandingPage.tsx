import { CatalogNavbar } from '@/features/catalog/components/CatalogNavbar';
import { CategoryNav } from '@/features/catalog/components/CategoryNav';
import { FeaturedProducts } from '@/features/catalog/components/FeaturedProducts';
import { HeroSection } from '@/features/catalog/components/HeroSection';

export function LandingPage(): JSX.Element {
  return (
    <div className="storefront min-h-screen bg-muted text-foreground">
      <CatalogNavbar />
      <HeroSection />
      <CategoryNav />
      <FeaturedProducts />
    </div>
  );
}
