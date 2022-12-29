const express = require('express');
const bodyParser = require('body-parser');
const { Op } = require("sequelize");

const { sequelize } = require('./model')
const { getProfile } = require('./middleware/getProfile')
const app = express();
app.use(bodyParser.json());
app.set('sequelize', sequelize)
app.set('models', sequelize.models)

app.get('/contracts', getProfile, async (req, res) => {
    const { Contract } = req.app.get('models')

    // TODO: improve terminated filtering
    const contracts = await Contract.findAll({
        where: {
            [Op.or]: [
                { ClientId: req.profile.id, status: { [Op.ne]: "terminated" } },
                { ContractorId: req.profile.id, status: { [Op.ne]: "terminated" } },
            ]
        }
    })

    res.json(contracts)
})

app.get('/contracts/:id', getProfile, async (req, res) => {
    const { Contract } = req.app.get('models')
    const { id } = req.params
    const contract = await Contract.findOne({ where: { id } })
    if (!contract) return res.status(404).end()

    if (!isProfileAuthorised(req.profile, contract)) {
        return res.status(403).end();
    }

    res.json(contract)
})

function isProfileAuthorised(profile, contract) {
    return contract.ClientId === profile.id || contract.ContractorId === profile.id;
}

module.exports = app;
