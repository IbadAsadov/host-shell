import { AppRouter } from "@router/AppRouter";
import { AppThemeProvider } from "@theme/AppThemeProvider";

export function App() {
  return (
    <AppThemeProvider>
      <AppRouter />
    </AppThemeProvider>
  );
}
