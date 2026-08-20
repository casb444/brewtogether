import { Button } from "@/components/Button";
import { BrandMark } from "@/components/BrandMark";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-parchment flex items-center justify-center px-6 text-center">
      <div>
        <BrandMark />
        <h1 className="font-display text-3xl text-ink mt-8 mb-3">That table is empty</h1>
        <p className="text-sm text-ink-soft mb-6">We couldn&apos;t find this page. The main café is still open.</p>
        <Button href="/" variant="primary">
          Back home
        </Button>
      </div>
    </div>
  );
}
