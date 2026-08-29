import { DashboardLayout } from '@/layouts/DashboardLayout'
import { GeneratorPage } from '@/features/icon-generator/pages/GeneratorPage'

export function DashboardPage() {
  return (
    <DashboardLayout>
      <GeneratorPage />
    </DashboardLayout>
  )
}
