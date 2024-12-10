const { expect } = require("chai");

const PatientRegistry = artifacts.require("PatientRegistry");
const truffleAssert = require('truffle-assertions');


contract("PatientRegistry", (accounts) => {
  let patientRegistry;
  const [patientAddress, otherAddress] = accounts;

  beforeEach(async () => {
    patientRegistry = await PatientRegistry.new();
  });

  it("should allow a patient to register", async () => {
    const tx = await patientRegistry.registerPatient("dataCID", { from: patientAddress });

    expect(tx.logs[0].event).to.equal("PatientRegistered");
    expect(tx.logs[0].args.patientAddress).to.equal(patientAddress);
    expect(tx.logs[0].args.dataCID).to.equal("dataCID");

    const isRegistered = await patientRegistry.isPatientRegistered(patientAddress);
    expect(isRegistered).to.be.true;
  });

  it("should not allow a patient to register twice", async () => {
    await patientRegistry.registerPatient("dataCID", { from: patientAddress });

    try {
      await patientRegistry.registerPatient("dataCID", { from: patientAddress });
      assert.fail("Expected error not received");
    } catch (error) {
      expect(error.reason).to.equal("Patient already registered");
    }
  });

  it("should allow a patient to update their data CID", async () => {
    await patientRegistry.registerPatient("dataCID", { from: patientAddress });

    const tx = await patientRegistry.updateDataCID("newDataCID", { from: patientAddress });

    expect(tx.logs[0].event).to.equal("DataCIDUpdated");
    expect(tx.logs[0].args.patientAddress).to.equal(patientAddress);
    expect(tx.logs[0].args.newDataCID).to.equal("newDataCID");

    const dataCID = await patientRegistry.getDataCID(patientAddress);
    expect(dataCID).to.equal("newDataCID");
  });

  it("should prevent others from updating patient's data CID", async () => {
    // Register the patientAddress
    await patientRegistry.registerPatient("dataCID", { from: patientAddress });

    // Ensure unauthorized user (otherAddress) cannot update data
    await truffleAssert.reverts(
        patientRegistry.updateDataCID("newDataCID", { from: otherAddress }),
        "Caller is not the patient"
    );

    // Verify the dataCID remains unchanged
    const dataCID = await patientRegistry.getDataCID(patientAddress);
    expect(dataCID).to.equal("dataCID");
  });



  it("should return correct registration status", async () => {
    let isRegistered = await patientRegistry.isPatientRegistered(patientAddress);
    expect(isRegistered).to.be.false;

    await patientRegistry.registerPatient("dataCID", { from: patientAddress });

    isRegistered = await patientRegistry.isPatientRegistered(patientAddress);
    expect(isRegistered).to.be.true;
  });
});
