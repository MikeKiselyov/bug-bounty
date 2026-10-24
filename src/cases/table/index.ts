import type { Bug, CaseDefinition } from '../../lib/types'
import bugs from './bugs.json'
import { TableApp } from './TableApp'

export const tableCase: CaseDefinition = {
  id: 'table',
  code: 'CASE-03',
  title: 'Table with filters',
  description: 'Employee directory: search, filter, sorting and pagination.',
  briefing:
    'An internal employee directory. Requirements: case-insensitive name search, a department filter, sorting by column with both mouse and keyboard, 5 records per page. Check that the table tells the truth.',
  level: 'middle',
  tags: ['tables', 'search', 'sorting'],
  url: 'hr-portal.local/employees',
  elements: [
    { id: 'search', label: 'Search' },
    { id: 'filter', label: 'Department filter' },
    { id: 'sort-name', label: 'Sort by name' },
    { id: 'sort-salary', label: 'Sort by salary' },
    { id: 'sort-date', label: 'Sort by hire date' },
    { id: 'headers', label: 'Table headers' },
    { id: 'cells', label: 'Table cells' },
    { id: 'empty', label: 'Empty table / message' },
    { id: 'counter', label: 'Record counter' },
    { id: 'pagination', label: 'Pagination' },
    { id: 'other', label: 'Other / whole page' },
  ],
  bugs: bugs as Bug[],
  App: TableApp,
}
