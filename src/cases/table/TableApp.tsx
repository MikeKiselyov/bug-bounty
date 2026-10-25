import { useEffect, useState } from 'react'
import { useBugTrigger } from '../../lib/bugTrigger'
import { useMediaQuery } from '../../lib/mediaQuery'
import { DEPARTMENTS, EMPLOYEES } from './employees'
import type { Employee } from './employees'
import './table.css'

// Planted bugs are marked with "BUG TBL-xx". Keep them when refactoring:
// the catalog in bugs.json depends on them. trigger('TBL-xx') fires when a bug becomes observable.

type SortKey = 'name' | 'salary' | 'hiredAt'
type SortDirection = 'asc' | 'desc'

const PAGE_SIZE = 5

function formatSalary(value: number | null): string {
  // BUG TBL-10: null is not handled and becomes the string "null".
  const digits = String(value)
  return '$' + digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

function compareEmployees(first: Employee, second: Employee, key: SortKey): number {
  if (key === 'name') {
    return first.name.localeCompare(second.name, 'en')
  }
  if (key === 'salary') {
    // BUG TBL-05: numbers are compared as strings.
    const firstSalary = String(first.salary)
    const secondSalary = String(second.salary)
    if (firstSalary < secondSalary) return -1
    if (firstSalary > secondSalary) return 1
    return 0
  }
  // BUG TBL-06: DD/MM/YYYY dates are compared as strings.
  if (first.hiredAt < second.hiredAt) return -1
  if (first.hiredAt > second.hiredAt) return 1
  return 0
}

// The full HR record as the backend stores it. The table shows only a few of these fields.
function fullRecord(employee: Employee) {
  return {
    ...employee,
    personalPhone: '+375 29 ' + (5550100 + employee.id * 37),
    homeAddress: 10 + employee.id + ' Park Lane, ' + employee.city,
    passportNumber: 'MP' + (3400000 + employee.id * 7919),
    bankAccount: 'BY20 OLMP 3135 0000 0010 0000 ' + (1000 + employee.id),
  }
}

function departmentLabel(department: string): string {
  // BUG TBL-04: typo in the filter option.
  if (department === 'Accounting') {
    return 'Acounting'
  }
  return department
}

function SortArrow({ direction }: { direction: SortDirection }) {
  // BUG TBL-07: the arrows are swapped.
  let path = 'M6 9l6 6 6-6'
  if (direction === 'desc') {
    path = 'M6 15l6-6 6 6'
  }
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={path} />
    </svg>
  )
}

export function TableApp() {
  const [query, setQuery] = useState('')
  const [department, setDepartment] = useState('all')
  const [sortKey, setSortKey] = useState<SortKey | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [page, setPage] = useState(1)
  const trigger = useBugTrigger()
  // Same query as in table.css.
  const isWideScreen = useMediaQuery('(min-width: 1440px)')

  useEffect(() => {
    if (isWideScreen) {
      // BUG TBL-13: on wide screens "Previous" and "Next" swap places, see .tbl-pager.
      trigger('TBL-13')
    }
  }, [isWideScreen, trigger])

  const normalizedQuery = query.trim().toLowerCase()
  const filtered: Employee[] = []
  for (const employee of EMPLOYEES) {
    // BUG TBL-01: the query is lowercased, the name is not.
    if (normalizedQuery !== '' && !employee.name.includes(normalizedQuery)) {
      continue
    }
    if (department !== 'all' && employee.department !== department) {
      continue
    }
    filtered.push(employee)
  }

  if (sortKey) {
    filtered.sort((first, second) => {
      const result = compareEmployees(first, second, sortKey)
      if (sortDirection === 'desc') {
        return -result
      }
      return result
    })
  }

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageStart = (page - 1) * PAGE_SIZE
  const pageRows = filtered.slice(pageStart, pageStart + PAGE_SIZE)

  // BUG TBL-09: the total ignores the filters.
  let counterText = 'Showing 0 of ' + EMPLOYEES.length
  if (pageRows.length > 0) {
    const rangeEnd = pageStart + pageRows.length
    counterText = 'Showing ' + (pageStart + 1) + '-' + rangeEnd + ' of ' + EMPLOYEES.length
  }

  // BUG TBL-11: "Next" is disabled one page too early.
  const isNextDisabled = page >= pageCount - 1
  const isPrevDisabled = page <= 1

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      if (sortDirection === 'asc') {
        setSortDirection('desc')
      } else {
        setSortDirection('asc')
      }
    } else {
      setSortKey(key)
      setSortDirection('asc')
    }
  }

  function ariaSort(key: SortKey): 'ascending' | 'descending' | 'none' {
    if (sortKey !== key) {
      return 'none'
    }
    if (sortDirection === 'asc') {
      return 'ascending'
    }
    return 'descending'
  }

  let isSearchCaseMissed = false
  if (normalizedQuery !== '') {
    for (const employee of EMPLOYEES) {
      const name = employee.name
      if (name.toLowerCase().includes(normalizedQuery) && !name.includes(normalizedQuery)) {
        isSearchCaseMissed = true
      }
    }
  }
  const isSearchMessageShown = pageRows.length === 0 && filtered.length === 0 && normalizedQuery !== ''
  const isHtmlInjected = isSearchMessageShown && /<[a-z!/]/i.test(query)
  const isPageEmptyAfterFilter = pageRows.length === 0 && filtered.length > 0
  const isCounterWrong = filtered.length !== EMPLOYEES.length
  let isNullSalaryShown = false
  for (const employee of pageRows) {
    if (employee.salary === null) {
      isNullSalaryShown = true
    }
  }
  const isLastPageBlocked = pageCount > 1 && page === pageCount - 1

  let pageIds = ''
  for (const employee of pageRows) {
    pageIds = pageIds + employee.id + ','
  }

  useEffect(() => {
    const records = []
    for (const employee of pageRows) {
      records.push(fullRecord(employee))
    }
    // BUG TBL-12: every page of the table is logged with the full records: phones, addresses, passports.
    console.log('[directory] page ' + page + ' loaded', records)
    trigger('TBL-12')
    // pageRows is rebuilt on every render, pageIds tells when the visible rows really change.
  }, [pageIds, page, trigger])

  useEffect(() => {
    if (isSearchCaseMissed) trigger('TBL-01')
    if (isHtmlInjected) trigger('TBL-02')
    if (isPageEmptyAfterFilter) trigger('TBL-03')
    if (sortKey === 'salary') trigger('TBL-05')
    if (sortKey === 'hiredAt') trigger('TBL-06')
    if (sortKey !== null) trigger('TBL-07')
    if (isCounterWrong) trigger('TBL-09')
    if (isNullSalaryShown) trigger('TBL-10')
    if (isLastPageBlocked) trigger('TBL-11')
  }, [
    isSearchCaseMissed,
    isHtmlInjected,
    isPageEmptyAfterFilter,
    sortKey,
    isCounterWrong,
    isNullSalaryShown,
    isLastPageBlocked,
    trigger,
  ])

  let emptyRow = null
  if (pageRows.length === 0) {
    if (isSearchMessageShown) {
      // BUG TBL-02: the raw query is injected as HTML.
      emptyRow = (
        <tr>
          <td colSpan={5} className="tbl-empty" data-bh="empty" dangerouslySetInnerHTML={{ __html: 'No results for "' + query + '"' }} />
        </tr>
      )
    } else {
      emptyRow = (
        <tr>
          <td colSpan={5} className="tbl-empty" data-bh="empty">
            No data
          </td>
        </tr>
      )
    }
  }

  return (
    <div className="tbl-page" data-bh="other">
      <header className="tbl-header">
        <span className="tbl-logo">HR Portal</span>
        <span className="tbl-section">Employee directory</span>
      </header>

      <div className="tbl-body">
        <div className="tbl-toolbar">
          <div className="tbl-control tbl-search" data-bh="search">
            <label htmlFor="tbl-search-input">Search by name</label>
            <input
              id="tbl-search-input"
              type="search"
              placeholder="For example, Anna"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value)
                setPage(1)
              }}
            />
          </div>
          <div className="tbl-control" data-bh="filter">
            <label htmlFor="tbl-department">Department</label>
            {/* BUG TBL-03: changing the department keeps the current page. */}
            <select id="tbl-department" value={department} onChange={(event) => setDepartment(event.target.value)}>
              <option value="all">All departments</option>
              {DEPARTMENTS.map((name) => (
                <option key={name} value={name}>
                  {departmentLabel(name)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="tbl-scroll">
          <table className="tbl-table">
            <thead>
              {/* BUG TBL-08: click handlers on th, no button, no tabIndex, no key handler. */}
              <tr>
                <th className="tbl-sortable" data-bh="sort-name" onClick={() => handleSort('name')} aria-sort={ariaSort('name')}>
                  <span className="tbl-th-inner">
                    Name
                    {sortKey === 'name' ? <SortArrow direction={sortDirection} /> : null}
                  </span>
                </th>
                <th data-bh="headers">Department</th>
                <th data-bh="headers">City</th>
                <th className="tbl-sortable" data-bh="sort-salary" onClick={() => handleSort('salary')} aria-sort={ariaSort('salary')}>
                  <span className="tbl-th-inner">
                    Salary
                    {sortKey === 'salary' ? <SortArrow direction={sortDirection} /> : null}
                  </span>
                </th>
                <th className="tbl-sortable" data-bh="sort-date" onClick={() => handleSort('hiredAt')} aria-sort={ariaSort('hiredAt')}>
                  <span className="tbl-th-inner">
                    Hire date
                    {sortKey === 'hiredAt' ? <SortArrow direction={sortDirection} /> : null}
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((employee) => (
                <tr key={employee.id} data-bh="cells">
                  <td>{employee.name}</td>
                  <td>{employee.department}</td>
                  <td>{employee.city}</td>
                  <td className="tbl-num">{formatSalary(employee.salary)}</td>
                  <td className="tbl-num">{employee.hiredAt}</td>
                </tr>
              ))}
              {emptyRow}
            </tbody>
          </table>
        </div>

        <div className="tbl-footer">
          <span className="tbl-counter" data-bh="counter">{counterText}</span>
          <nav className="tbl-pager" aria-label="Pages" data-bh="pagination">
            <button type="button" disabled={isPrevDisabled} onClick={() => setPage(page - 1)}>
              Previous
            </button>
            <span>
              Page {page} of {pageCount}
            </span>
            <button type="button" disabled={isNextDisabled} onClick={() => setPage(page + 1)}>
              Next
            </button>
          </nav>
        </div>
      </div>
    </div>
  )
}
