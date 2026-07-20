import { Outlet } from '@tanstack/react-router';
import { AppNav } from '../../widgets/app-nav/index.ts';
import styles from './RootLayout.module.css';

/** Application shell: sticky nav plus the routed page in the main region. */
export function RootLayout() {
  return (
    <div className={styles.shell}>
      <AppNav />
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}
