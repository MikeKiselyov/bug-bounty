export interface Employee {
  id: number
  name: string
  department: string
  city: string
  salary: number | null
  hiredAt: string
}

export const DEPARTMENTS = ['Engineering', 'Marketing', 'Accounting', 'Sales', 'Support']

export const EMPLOYEES: Employee[] = [
  { id: 1, name: 'Anna Smith', department: 'Engineering', city: 'London', salary: 240000, hiredAt: '14/03/2019' },
  { id: 2, name: 'James Carter', department: 'Sales', city: 'Berlin', salary: 95000, hiredAt: '02/11/2021' },
  { id: 3, name: 'Maria Garcia', department: 'Marketing', city: 'Madrid', salary: 130000, hiredAt: '27/06/2020' },
  { id: 4, name: 'Daniel Novak', department: 'Engineering', city: 'Prague', salary: 185000, hiredAt: '09/01/2023' },
  { id: 5, name: 'Elena Kowalski', department: 'Accounting', city: 'Warsaw', salary: 110000, hiredAt: '18/09/2017' },
  { id: 6, name: 'Sergei Ivanov', department: 'Support', city: 'Minsk', salary: 78000, hiredAt: '30/04/2022' },
  { id: 7, name: 'Olivia Brown', department: 'Sales', city: 'London', salary: 145000, hiredAt: '05/12/2018' },
  { id: 8, name: 'Alex Johnson', department: 'Engineering', city: 'Amsterdam', salary: 310000, hiredAt: '21/07/2016' },
  { id: 9, name: 'Tatiana Petrova', department: 'Marketing', city: 'Vilnius', salary: 98000, hiredAt: '11/02/2024' },
  { id: 10, name: 'Nick Lebowski', department: 'Support', city: 'Berlin', salary: 82000, hiredAt: '03/08/2020' },
  { id: 11, name: 'Sophie Martin', department: 'Accounting', city: 'Paris', salary: 125000, hiredAt: '16/05/2019' },
  { id: 12, name: 'Paul Fischer', department: 'Engineering', city: 'Vienna', salary: 205000, hiredAt: '25/10/2022' },
  { id: 13, name: 'Julia Rossi', department: 'Sales', city: 'Milan', salary: null, hiredAt: '08/03/2023' },
  { id: 14, name: 'Artem Sokolov', department: 'Support', city: 'Minsk', salary: 74000, hiredAt: '19/01/2024' },
  { id: 15, name: 'Irene Walsh', department: 'Marketing', city: 'Dublin', salary: 160000, hiredAt: '12/09/2015' },
  { id: 16, name: 'Max Weber', department: 'Engineering', city: 'Munich', salary: 175000, hiredAt: '29/11/2021' },
  { id: 17, name: 'Laura Bianchi', department: 'Accounting', city: 'Rome', salary: 99000, hiredAt: '07/06/2022' },
  { id: 18, name: 'Andrew Fox', department: 'Sales', city: 'London', salary: 120000, hiredAt: '23/02/2020' },
  { id: 19, name: 'Anna Lindqvist', department: 'Support', city: 'Stockholm', salary: 86000, hiredAt: '15/12/2023' },
  { id: 20, name: 'Victor Hugo', department: 'Engineering', city: 'Lyon', salary: 150000, hiredAt: '04/04/2018' },
  { id: 21, name: 'Kate Zhukova', department: 'Marketing', city: 'Riga', salary: 115000, hiredAt: '26/08/2021' },
  { id: 22, name: 'Roman Kovac', department: 'Sales', city: 'Bratislava', salary: 105000, hiredAt: '10/10/2019' },
  { id: 23, name: 'Natalie Orlova', department: 'Accounting', city: 'Tallinn', salary: 135000, hiredAt: '01/07/2024' }
]
