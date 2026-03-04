import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { DateTimeProvider } from './context/DateTimeContext.tsx'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DateTimeProvider>
    <App />
    </DateTimeProvider>
  </StrictMode>,
)
