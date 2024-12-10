
const { expect } = require("chai");

const PatientRegistry = artifacts.require("PatientRegistry");
const HealthcareProviderRegistry = artifacts.require("HealthcareProviderRegistry");
const AccessControl = artifacts.require("AccessControl");
const MedicalRecords = artifacts.require("MedicalRecords");
const truffleAssert = require('truffle-assertions');



contract("MedicalRecords", (accounts) => {
  let patientRegistry;
  let providerRegistry;
  let accessControl;
  let medicalRecords;
  const [admin, patientAddress, providerAddress, otherProvider] = accounts;

  beforeEach(async () => {
    // Deploy PatientRegistry
    patientRegistry = await PatientRegistry.new();

    // Deploy HealthcareProviderRegistry
    providerRegistry = await HealthcareProviderRegistry.new({ from: admin });

    // Deploy AccessControl
    accessControl = await AccessControl.new(patientRegistry.address, providerRegistry.address);

    // Deploy MedicalRecords
    medicalRecords = await MedicalRecords.new(accessControl.address);

    // Register patient
    await patientRegistry.registerPatient("patientDataCID", { from: patientAddress });

    // Register and verify provider
    await providerRegistry.registerHealthcareProvider("providerDataCID", { from: providerAddress });
    await providerRegistry.verifyHealthcareProvider(providerAddress, { from: admin });

    // Provider requests access
    const purposeHash = web3.utils.keccak256("Access for treatment");
    await accessControl.requestAccess(patientAddress, purposeHash, { from: providerAddress });

    // Patient approves access
    await accessControl.approveAccess(providerAddress, { from: patientAddress });
  });

  it("should allow authorized provider to upload medical record", async () => {
    const encryptedCID = web3.utils.keccak256("encryptedCID");

    const tx = await medicalRecords.uploadMedicalRecord(patientAddress, encryptedCID, { from: providerAddress });

    expect(tx.logs[0].event).to.equal("MedicalRecordUploaded");
    expect(tx.logs[0].args.patientAddress).to.equal(patientAddress);
    expect(tx.logs[0].args.providerAddress).to.equal(providerAddress);
    expect(tx.logs[0].args.encryptedCID).to.equal(encryptedCID);
  });

  it("should prevent unauthorized provider from retrieving patient's medical records", async () => {
    const encryptedCID = web3.utils.keccak256("encryptedCID");

    // Upload a medical record by an authorized provider
    await medicalRecords.uploadMedicalRecord(patientAddress, encryptedCID, { from: providerAddress });

    // Attempt retrieval by an unauthorized provider
    await truffleAssert.reverts(
        medicalRecords.getPatientRecords(patientAddress, { from: otherProvider }),
        "Caller is not authorized"
    );
  });

  

  it("should allow patient to retrieve their medical records", async () => {
    const encryptedCID1 = web3.utils.keccak256("encryptedCID1");
    const encryptedCID2 = web3.utils.keccak256("encryptedCID2");

    await medicalRecords.uploadMedicalRecord(patientAddress, encryptedCID1, { from: providerAddress });
    await medicalRecords.uploadMedicalRecord(patientAddress, encryptedCID2, { from: providerAddress });

    const records = await medicalRecords.getMedicalRecords({ from: patientAddress });

    expect(records.length).to.equal(2);
    expect(records[0].encryptedCID).to.equal(encryptedCID1);
    expect(records[1].encryptedCID).to.equal(encryptedCID2);
  });

  it("should allow authorized provider to retrieve patient's medical records", async () => {
    const encryptedCID = web3.utils.keccak256("encryptedCID");

    await medicalRecords.uploadMedicalRecord(patientAddress, encryptedCID, { from: providerAddress });

    const records = await medicalRecords.getPatientRecords(patientAddress, { from: providerAddress });

    expect(records.length).to.equal(1);
    expect(records[0].encryptedCID).to.equal(encryptedCID);
  });

  it("should prevent unauthorized provider from retrieving patient's medical records", async () => {
    const encryptedCID = web3.utils.keccak256("encryptedCID");

    await medicalRecords.uploadMedicalRecord(patientAddress, encryptedCID, { from: providerAddress });

    try {
      await medicalRecords.getPatientRecords(patientAddress, { from: otherProvider });
      assert.fail("Expected error not received");
    } catch (error) {
      expect(error.reason).to.equal("Caller is not authorized");
    }
  });
});
