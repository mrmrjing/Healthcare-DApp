

const { expect } = require("chai");

const PatientRegistry = artifacts.require("PatientRegistry");
const HealthcareProviderRegistry = artifacts.require("HealthcareProviderRegistry");
const AccessControl = artifacts.require("AccessControl");
const truffleAssert = require('truffle-assertions');



contract("AccessControl", (accounts) => {
  let patientRegistry;
  let providerRegistry;
  let accessControl;
  const [admin, patientAddress, providerAddress, otherProvider] = accounts;

  beforeEach(async () => {
    // Deploy PatientRegistry
    patientRegistry = await PatientRegistry.new();

    // Deploy HealthcareProviderRegistry
    providerRegistry = await HealthcareProviderRegistry.new({ from: admin });

    // Deploy AccessControl
    accessControl = await AccessControl.new(patientRegistry.address, providerRegistry.address);

    // Register patient
    await patientRegistry.registerPatient("patientDataCID", { from: patientAddress });

    // Register and verify provider
    await providerRegistry.registerHealthcareProvider("providerDataCID", { from: providerAddress });
    await providerRegistry.verifyHealthcareProvider(providerAddress, { from: admin });

    // Register another provider but do not verify
    await providerRegistry.registerHealthcareProvider("otherProviderDataCID", { from: otherProvider });
  });

  it("should allow a verified provider to request access", async () => {
    const purposeHash = web3.utils.keccak256("Access for treatment");

    const tx = await accessControl.requestAccess(patientAddress, purposeHash, { from: providerAddress });

    expect(tx.logs[0].event).to.equal("AccessRequested");
    expect(tx.logs[0].args.patientAddress).to.equal(patientAddress);
    expect(tx.logs[0].args.providerAddress).to.equal(providerAddress);
    expect(tx.logs[0].args.purposeHash).to.equal(purposeHash);
  });

  it("should prevent unverified provider from requesting access", async () => {
    const purposeHash = web3.utils.keccak256("Access for treatment");
    await truffleAssert.reverts(
      accessControl.requestAccess(patientAddress, purposeHash, { from: otherProvider }),
      "Caller is not a verified provider"
    );
  });

  it("should allow patient to approve access request", async () => {
    const purposeHash = web3.utils.keccak256("Access for treatment");
    await accessControl.requestAccess(patientAddress, purposeHash, { from: providerAddress });

    const tx = await accessControl.approveAccess(providerAddress, { from: patientAddress });

    expect(tx.logs[0].event).to.equal("AccessApproved");
    expect(tx.logs[0].args.patientAddress).to.equal(patientAddress);
    expect(tx.logs[0].args.providerAddress).to.equal(providerAddress);

    const isAuthorized = await accessControl.checkAccess(patientAddress, providerAddress);
    expect(isAuthorized).to.be.true;
  });

  it("should allow patient to revoke access", async () => {
    const purposeHash = web3.utils.keccak256("Access for treatment");
    await accessControl.requestAccess(patientAddress, purposeHash, { from: providerAddress });
    await accessControl.approveAccess(providerAddress, { from: patientAddress });

    const tx = await accessControl.revokeAccess(providerAddress, { from: patientAddress });

    expect(tx.logs[0].event).to.equal("AccessRevoked");
    expect(tx.logs[0].args.patientAddress).to.equal(patientAddress);
    expect(tx.logs[0].args.providerAddress).to.equal(providerAddress);

    const isAuthorized = await accessControl.checkAccess(patientAddress, providerAddress);
    expect(isAuthorized).to.be.false;
  });

  it("should prevent provider from accessing data without approval", async () => {
    const isAuthorized = await accessControl.checkAccess(patientAddress, providerAddress);
    expect(isAuthorized).to.be.false;
  });
});
