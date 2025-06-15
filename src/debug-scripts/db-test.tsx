export function seedDatabase() {
  const now = new Date().toISOString()

  // // Insert mock clients
  // const insertClient = db.prepare(`
  //   INSERT OR REPLACE INTO clients (id, name, phone, email, address, notes, updatedAt)
  //   VALUES (@id, @name, @phone, @email, @address, @notes, @updatedAt)
  // `)

  const mockClients = [
    {
      id: 'c1',
      name: 'Alice Sharma',
      phone: '9876543210',
      email: 'alice@example.com',
      address: '123 Civil Lines',
      notes: 'Prefers email communication',
      updatedAt: now
    },
    {
      id: 'c2',
      name: 'Bob Verma',
      phone: '9123456780',
      email: 'bob@example.com',
      address: '45 MG Road',
      notes: '',
      updatedAt: now
    }
  ]

  mockClients.forEach(client => window.db.insertClient(client))
  console.log(window.db.getAllClients())

  // // Insert mock cases
  // const insertCase = db.prepare(`
  //   INSERT OR REPLACE INTO cases (id, clientId, title, description, status, court, createdAt, tags, updatedAt)
  //   VALUES (@id, @clientId, @title, @description, @status, @court, @createdAt, @tags, @updatedAt)
  // `)

  const mockCases = [
    {
      id: 'case1',
      clientId: 'c1',
      title: 'Property Dispute',
      description: 'Dispute over ancestral land',
      status: 'Open',
      court: 'District Court',
      createdAt: now,
      tags: JSON.stringify(['civil', 'urgent']),
      updatedAt: now
    },
    {
      id: 'case2',
      clientId: 'c2',
      title: 'Cheque Bounce',
      description: 'Client received a bounced cheque',
      status: 'Pending',
      court: 'High Court',
      createdAt: now,
      tags: JSON.stringify(['financial']),
      updatedAt: now
    }
  ]

  // mockCases.forEach(kase => insertCase.run(kase))

  // Insert mock appointments
  // const insertAppointment = db.prepare(`
  //   INSERT OR REPLACE INTO appointments (id, title, clientId, caseId, date, time, notes, updatedAt)
  //   VALUES (@id, @title, @clientId, @caseId, @date, @time, @notes, @updatedAt)
  // `)

  const mockAppointments = [
    {
      id: 'appt1',
      title: 'Initial Consultation',
      clientId: 'c1',
      caseId: 'case1',
      date: '2025-06-18',
      time: '10:00',
      notes: 'Bring all land documents',
      updatedAt: now
    },
    {
      id: 'appt2',
      title: 'Court Hearing',
      clientId: 'c2',
      caseId: 'case2',
      date: '2025-06-20',
      time: '14:30',
      notes: '',
      updatedAt: now
    }
  ]

  // mockAppointments.forEach(appt => insertAppointment.run(appt))
}

