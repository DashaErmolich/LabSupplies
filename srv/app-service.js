
const cds = require('@sap/cds')

module.exports = function(srv) {
    const { Orders } = srv.entities;
    this.before('CREATE', Orders, (req) => {
      const data = new Date();

      req.data.title = `Order ${data.getDate()}/${data.getMinutes()}`;
    });
}