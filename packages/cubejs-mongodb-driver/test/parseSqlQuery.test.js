const { parseSqlQuery, getSelection, getSources, getSpecialStatements, parseColumnName } = require('../parser/parseSqlQuery');

describe('SQL Query Parser', () => {
  test('should parse selection items', () => {
    const q = 'SELECT "donors".city "donors__city", count("donors"._id) "donors__count"';

    const result = getSelection(q);

    expect(result).toStrictEqual([
      {
        columnName: 'city',
        columnLabel: 'donors__city',
        type: 'column',
      },
      {
        columnName: '_id',
        columnLabel: 'donors__count',
        type: 'count',
      }
    ]);
  });

  test('should parse column names', () => {
    const q = '"donors"."Donor State" "donors__donor_state"';

    const result = parseColumnName(q);

    expect(result).toStrictEqual({
      columnName: 'Donor State',
      columnLabel: 'donors__donor_state',
    });
  });

  test('should parse column names - no source specified', () => {
    const q = 'Donor City "donors__city"';

    const result = parseColumnName(q);

    expect(result).toStrictEqual({
      columnName: 'Donor City',
      columnLabel: 'donors__city',
    });
  });

  test('should parse entire queries', () => {
    const q = `
  SELECT
    "donors"."Donor State" "donors__donor_state",
    count(*) "donors__count"
    FROM test.donors AS "donors"
    GROUP BY 1
    ORDER BY 2 DESC
    LIMIT 10000`;

    const result = parseSqlQuery(q);

    expect(result).toStrictEqual({
      source: 'donors',
      aggregate: [
        {
          $limit: 10000,
        },
        {
          $group: {
            _id: {
              donors__donor_state: '$Donor State',
            },
            donors__count: {
              $sum: 1,
            },
          },
        },
        {
          $project: {
            _id: 0,
            donors__donor_state: '$_id.donors__donor_state',
            donors__count: 1,
          }
        },
        {
          $sort: {
            donors__count: -1
          },
        },
      ],
    });
  });

  test('should parse entire queries - query 2', () => {
    const q = `
  SELECT
  count(*) "donors__count"
  FROM test.donors AS "donors"
  WHERE ("donors"."Donor City" = "$1")
  LIMIT 10000`;
  
    const result = parseSqlQuery(q, ['San Francisco']);
  
    expect(result).toStrictEqual({
      source: 'donors',
      aggregate: [
        {
          $limit: 10000,
        },
        {
          $match: {
            'Donor City': {
              $in: [
                'San Francisco',
              ],
            },
          },
        },
        {
          $count: 'donors__count',
        },
      ],
    });
  });

  test('should parse entire queries - query 3', () => {
    const q = `
    SELECT Donor City "donors__city", count(Donor ID) "donors__count"
    FROM public.donors AS "donors"
    WHERE (Donor City = $1) GROUP BY 1 ORDER BY 2 DESC LIMIT 10000`;
  
    const result = parseSqlQuery(q, ['Flagstaff']);
  
    expect(result).toStrictEqual({
      source: 'donors',
      aggregate: [
        {
          $limit: 10000
        },
        {
          $group: {
            _id: {
              donors__city: '$Donor City'
            },
            donors__count: { $sum: 1 }
          }
        },
        {
          $project: {
            donors__city: '$_id.donors__city',
            _id: 0,
            donors__count: 1
          }
        },
        {
          $match: {
            donors__city: {
              $in: ['Flagstaff']
            }
          }
        },
        {
          $sort: {
            donors__count: -1
          }
        }
      ] });
  });
});
