const { Profile, Contract, Job } = require('../src/model');
const seed = require('./seed');

/* WARNING THIS WILL DROP THE CURRENT DATABASE */
seed();
