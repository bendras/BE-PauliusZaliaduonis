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

    // TODO: improve status field filtering
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

app.get('/jobs/unpaid', getProfile, async (req, res) => {
    const { Contract, Job } = req.app.get('models')

    const jobs = await Job.findAll({
        where: {
            [Op.or]: [
                { paid: { [Op.eq]: false } },
                { paid: { [Op.is]: null } },
            ]
        },
        include: [
            {
                model: Contract,
                required: true,
                where: {
                    [Op.or]: [
                        { ClientId: req.profile.id, status: { [Op.ne]: "terminated" } },
                        { ContractorId: req.profile.id, status: { [Op.ne]: "terminated" } },
                    ]
                }
            }
        ]
    })

    res.json(jobs)
})

app.post('/jobs/:id/pay', getProfile, async (req, res) => {
    const { Contract, Job } = req.app.get('models')

    const { id } = req.params
    const job = await Job.findOne({
        where: { id },
        include: [
            {
                model: Contract,
                required: true,
            }
        ]
    })
    if (!job) return res.status(404).end()

    if (!isProfileAuthorised(req.profile, job.Contract)) {
        return res.status(403).end();
    }

    if (!isClient(req.profile, job.Contract)) {
        return res.status(400).json({ message: "Only client can pay for the job" }).end();
    }

    if (job.paid) {
        return res.status(400).json({ message: "Job has been paid already" }).end();
    }

    if (!hasFunds(req.profile, job.price)) {
        return res.status(400).json({ message: "Insufficient funds" }).end();
    }

    // TODO: transfer the amount to contractor balance.
    const amountToPay = job.price;

    const transaction = await sequelize.transaction();
    try {
        await Job.update({ paid: true }, { transaction, where: { id } })
        // await Profile.update({ }, { transaction, where: { id } })

        await transaction.commit();
    } catch (error) {
        await transaction.rollback();
    }


    res.json({ id, paid: true })
})

function isProfileAuthorised(profile, contract) {
    return contract.ClientId === profile.id || contract.ContractorId === profile.id;
}

function isClient(profile, contract) {
    return contract.ClientId === profile.id;
}

function hasFunds(profile, fundsRequired) {
    return profile.balance > fundsRequired;
}

module.exports = app;
