// import { insertClient } from './db/clientRepo'
// import { insertCase } from './db/caseRepo'
// import { insertTask } from './db/taskRepo'
import { v4 as uuid } from 'uuid'

export function populateDummyData() {
  const clients = [
    {
      id: uuid(),
      name: 'Alice Sharma',
      phone: '9876543210',
      email: 'alice@example.com',
      address: 'Delhi',
      notes: 'High-priority client'
    },
    {
      id: uuid(),
      name: 'Bob Verma',
      phone: '9123456789',
      email: 'bob@example.com',
      address: 'Mumbai'
    }
  ]

  for (const client of clients) {
    console.log(window.database.insertClient(client))

    const legalCase = {
      id: '1234567890123456',
      title: `Case for ${client.name}`,
      description: 'Some legal issue',
      status: 'Open' as const,
      client_id: client.id,
      court: 'High Court',
      created_at: new Date().toISOString(),
      tags: ['civil', 'urgent']
    }

    console.log(window.database.insertCase(legalCase))

    const task = {
      id: uuid(),
      title: `Meet ${client.name}`,
      date: new Date().toISOString().split('T')[0],
      time: '10:30',
      client_id: client.id,
      caseId: legalCase.id,
      notes: 'Prepare documents',
    }

    console.log(window.database.insertTask(task))
  }

  console.log('✅ Dummy data inserted')
}
