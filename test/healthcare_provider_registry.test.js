
const { expect } = require("chai");

const HealthcareProviderRegistry = artifacts.require("HealthcareProviderRegistry");


contract("HealthcareProviderRegistry", (accounts) => {
  let providerRegistry;
  const [admin, providerAddress, otherAddress] = accounts;

  beforeEach(async () => {
    providerRegistry = await HealthcareProviderRegistry.new({ from: admin });
  });

  it("should allow a provider to register", async () => {
    const tx = await providerRegistry.registerHealthcareProvider("providerDataCID", { from: providerAddress });

    expect(tx.logs[0].event).to.equal("ProviderRegistered");
    expect(tx.logs[0].args.providerAddress).to.equal(providerAddress);
    expect(tx.logs[0].args.dataCID).to.equal("providerDataCID");

    const isRegistered = await providerRegistry.isProviderRegistered(providerAddress);
    expect(isRegistered).to.be.true;
  });

  it("should not allow a provider to register twice", async () => {
    await providerRegistry.registerHealthcareProvider("providerDataCID", { from: providerAddress });

    try {
      await providerRegistry.registerHealthcareProvider("providerDataCID", { from: providerAddress });
      assert.fail("Expected error not received");
    } catch (error) {
      expect(error.reason).to.equal("Provider already registered");
    }
  });

  it("should allow admin to verify a registered provider", async () => {
    await providerRegistry.registerHealthcareProvider("providerDataCID", { from: providerAddress });

    const tx = await providerRegistry.verifyHealthcareProvider(providerAddress, { from: admin });

    expect(tx.logs[0].event).to.equal("ProviderVerified");
    expect(tx.logs[0].args.providerAddress).to.equal(providerAddress);

    const isVerified = await providerRegistry.isProviderVerified(providerAddress);
    expect(isVerified).to.be.true;
  });

  it("should prevent non-admin from verifying a provider", async () => {
    await providerRegistry.registerHealthcareProvider("providerDataCID", { from: providerAddress });

    try {
      await providerRegistry.verifyHealthcareProvider(providerAddress, { from: otherAddress });
      assert.fail("Expected error not received");
    } catch (error) {
      expect(error.reason).to.equal("Caller is not the admin");
    }
  });

  it("should prevent verifying an unregistered provider", async () => {
    try {
      await providerRegistry.verifyHealthcareProvider(providerAddress, { from: admin });
      assert.fail("Expected error not received");
    } catch (error) {
      expect(error.reason).to.equal("Provider not registered");
    }
  });
});
