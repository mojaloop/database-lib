// .ncurc.js
module.exports = {
  // ... other ncu configuration ...

  reject: [
    'npm-check-updates'  // Per .nvmrc Node.js version cannot further update this lib
  ],
};
