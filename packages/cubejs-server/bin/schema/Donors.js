cube(`Donors`, {
  sql: `SELECT * FROM public.donors`,
  
  joins: {
    
  },
  
  measures: {
    count: {
      type: `count`,
      drillMembers: [id, city, state, isTeacher, zip]
    }
  },
  
  dimensions: {
    'id': {
      sql: `Donor ID`,
      type: `string`,
      primaryKey: true,
      shown: true,
    },

    'city': {
      sql: `Donor City`,
      type: `string`,
    },
    
    'state': {
      sql: `Donor State`,
      type: `string`,
    },

    'isTeacher': {
      sql: 'Donor Is Teacher',
      type: `string`,
    },

    'zip': {
      sql: `Donor Zip`,
      type: `number`,
      shown: true,
    }
  }
});
