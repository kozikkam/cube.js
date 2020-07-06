const parseSqlQuery = (sqlQuery, values) => {
  const normalizedQuery = normalizeQuery(sqlQuery);
  const selection = getSelection(normalizedQuery);
  const sources = getSources(normalizedQuery);
  const specialStatements = getSpecialStatements(normalizedQuery);
  const groupBy = getGroupBy(normalizedQuery, selection);
  const sortBy = getSortBy(normalizedQuery, selection);
  const whereStatement = getWhere(normalizedQuery, values, selection);

  const columnSelection = selection.filter((s) => s.type === 'column');
  const projection = {
    $project: {
      ...columnSelection.reduce((acc, el) => ({ ...acc, [el.columnLabel]: `$${[el.columnName]}` }), {}),
    },
  };

  let group = null;
  if (groupBy) {
    group = { $group: { _id: groupBy } };
    for (const el of Object.keys(groupBy)) {
      projection.$project[el] = `$_id.${el}`;
    }
    projection.$project['_id'] = 0;
  }

  const countElement = selection.filter((s) => s.type === 'count')[0];
  let count = null;
  if (countElement) {
    if (group) {
      group.$group[countElement.columnLabel || `count`] = { $sum: 1 };
      projection.$project[countElement.columnLabel || `count`] = 1;
    } else {
      count = {
        $count: countElement.columnLabel || `count`,
      }
    }
  }

  const match = whereStatement && Object.keys(whereStatement).length ? { $match: whereStatement } : null;

  let sort = null;
  if (sortBy) {
    sort = { $sort: sortBy };
  }

  return {
    source: sources[0],
    aggregate: [
      ...specialStatements,
      group,
      Object.keys(projection.$project).length ? projection : null,
      match,
      count,
      sort,
    ].filter(Boolean),
  };
};

const normalizeQuery = (sql) => {
  const noNewLinesQuery = sql.replace(/\n/g, ' ');
  return noNewLinesQuery.replace(/\s+/g, ' ');
}

const getSelection = (sql) => {
  let selectSql = sql.match(/SELECT (.+?(?=FROM|$))/i);
  if (selectSql) {
    selectSql = selectSql.slice(-1)[0];
  }

  const cleanedSelectionItems = selectSql.split(',').map((item) => {
    let itemName = item.split('AS')[0].trim();

    return itemName;
  });

  const tokenizedSelectionItems = cleanedSelectionItems.map((item) => {
    const itemLowerCase = item.toLowerCase();
    if (itemLowerCase.includes('count')) {
      return {
        ...parseColumnName(item),
        type: 'count',
      }
    }

    if (itemLowerCase.includes('sum')) {
      return {
        ...parseColumnName(item),
        type: 'sum',
      }
    }

    return {
      ...parseColumnName(item),
      type: 'column',
    };
  });

  return tokenizedSelectionItems;
};

const getSources = (sql) => {
  let matches = sql.match(/FROM (.+?(?=GROUP BY|ORDER BY|LIMIT|$))/);
  if (!matches) {
    throw new Error('Could not parse sources for', sql);
  }
  return matches.slice(-1)[0].match(/".*?"/g).map((match) => match.slice(1, match.length - 1));
};

const getSpecialStatements = (sqlQuery) => {
  const matches = sqlQuery.match(/LIMIT [0-9]+/);
  if (matches && matches.length) {
    return [{
      $limit: Number(matches[0].split(' ')[1]),
    }];
  }

  return [];
}

const getGroupBy = (sqlQuery, selection) => {
  const matches = sqlQuery.match(/GROUP BY ([0-9|,|\s]+)/);
  if (matches && matches.length) {
    const groupByFields = matches.slice(-1)[0].split(',').map(Number);
    return groupByFields.reduce((acc, el) => {
      return {
        ...acc,
        [selection[el - 1].columnLabel]: `$${[selection[el - 1].columnName]}`
      };
    }, {});
  }

  return null;
}

const getWhere = (sqlWhereQuery, values, selection) => {
  let matches = sqlWhereQuery.match(/WHERE (.+?(?=GROUP BY|ORDER BY|LIMIT|$))/i);
  if (matches && matches.length) {
    matches = matches[0].match(/\(([^\)]*)/g);

    if (!matches || !matches.length) {
      return null;
    }

    const parseWhereColumnName = (expression) => {
      let columnName = expression.match(/[^=]+/);
      if (!columnName) {
        throw new Error(`Could not parse value for ${expression}`);
      }
      columnName = columnName[0].trim();
      columnName = columnName.split('.').slice(-1)[0];
      let parsedColumnName = columnName[0] === '(' ? columnName.slice(1, columnName.length) : columnName;
      parsedColumnName = parsedColumnName[0] === '"' ? parsedColumnName.slice(1, parsedColumnName.length - 1) : parsedColumnName;

      return parsedColumnName;
    }

    return matches.reduce((acc, el) => {
      const matchedValues = el.match(/\$([0-9]+)/g);
      const columnName = parseWhereColumnName(el);
      if (matchedValues) {
        const matchingSelection = selection.find((s) => s.columnName === columnName);
        return {
          ...acc,
          [matchingSelection ? matchingSelection.columnLabel : columnName]: {
            $in: matchedValues.map((v) => values[Number(v.slice(1, v.length)) - 1])
          },
        };
      }
      throw new Error(`Could not parse value for ${el}`);
    }, {});
  }
};

const getSortBy = (sqlQuery, selection) => {
  let matches = sqlQuery.match(/ORDER BY ([0-9|,|\s|ASC|DESC]+)/);
  if (matches && matches.length) {
    matches = matches.slice(-1)[0].split(',');
    const globalDirection = matches.slice(-1)[0].includes('ASC') ? 1 : -1;

    return matches.reduce((acc, match) => {
      if (match.includes('ASC')) {
        return { ...acc, [selection[parseInt(match) - 1].columnLabel]: 1 };
      } else if (match.includes('DESC')) {
        return { ...acc, [selection[parseInt(match) - 1].columnLabel]: -1 };
      } else {
        return { ...acc, [selection[parseInt(match) - 1].columnLabel]: globalDirection };
      }
    }, {});
  }

  return null;
}

const parseColumnName = (sql) => {
  let columnName = sql.match(/\."([^"]*)/) || sql.match(/\.([^\s|)]*)/) || sql.match(/[^"]*/);
  if (columnName) {
    columnName = columnName.slice(-1)[0].trim();
  }

  if (!columnName) {
    columnName = sql;
  }

  let columnLabel = sql.substring(sql.indexOf(columnName) + 1, sql.length).match(/"([^\s]*?)"/);
  if (columnLabel && columnLabel.length) {
    columnLabel = columnLabel.slice(-1)[0];
  }

  return {
    columnName,
    columnLabel: columnLabel || columnName,
  };
}

module.exports = { parseSqlQuery, getSelection, getSources, getSpecialStatements, parseColumnName };
