import { useChainGuard } from '@/store/useChainGuard';
import { BackgroundFX, Footer } from '@/components/shell/Chrome';
import { TopBar } from '@/components/shell/TopBar';
import { AlertModal } from '@/components/shell/AlertModal';
import { Toasts } from '@/components/ui/Toasts';
import { VendorTerminal } from '@/components/vendor/VendorTerminal';
import { DriverPortal } from '@/components/driver/DriverPortal';
import { CustomerPortal } from '@/components/customer/CustomerPortal';
import { AuditPlane } from '@/components/audit/AuditPlane';

export default function App() {
  const role = useChainGuard((state) => state.role);

  return (
    <div className="relative flex min-h-screen flex-col bg-slate-950">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-emerald-500 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-emerald-950"
      >
        Skip to content
      </a>
      <BackgroundFX />
      <TopBar />
      <main
        id="main"
        key={role}
        className="relative mx-auto w-full max-w-[1440px] flex-1 animate-fade-in px-4 pb-16 pt-7 sm:px-6 lg:px-10"
      >
        {role === 'vendor' ? <VendorTerminal /> : null}
        {role === 'driver' ? <DriverPortal /> : null}
        {role === 'customer' ? <CustomerPortal /> : null}
        {role === 'audit' ? <AuditPlane /> : null}
      </main>
      <Footer />
      <AlertModal />
      <Toasts />
    </div>
  );
}
