// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract HealthcareProviderRegistry {
    address public admin;

    constructor() {
        admin = msg.sender;
    }

    struct HealthcareProvider {
        address providerAddress;
        string name;
        string clinicName;
        string licenseNumber;
        bool isVerified;
    }

    mapping(address => HealthcareProvider) private healthcareProviders;

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can perform this action.");
        _;
    }

    // Function to register a new healthcare provider
    function registerHealthcareProvider(
        string calldata name,
        string calldata clinicName,
        string calldata licenseNumber
    ) external {
        require(
            healthcareProviders[msg.sender].providerAddress == address(0),
            "Provider already registered."
        );

        healthcareProviders[msg.sender] = HealthcareProvider({
            providerAddress: msg.sender,
            name: name,
            clinicName: clinicName,
            licenseNumber: licenseNumber,
            isVerified: false
        });
    }

    // Function for admin to verify a healthcare provider
    function verifyHealthcareProvider(address providerAddress)
        external
        onlyAdmin
    {
        require(
            healthcareProviders[providerAddress].providerAddress != address(0),
            "Provider not registered."
        );
        healthcareProviders[providerAddress].isVerified = true;
    }

    // Function to check if a provider is verified
    function isProviderVerified(address providerAddress)
        external
        view
        returns (bool)
    {
        return healthcareProviders[providerAddress].isVerified;
    }

    // Function to retrieve provider information
    function getHealthcareProvider(address providerAddress)
        external
        view
        returns (
            address,
            string memory,
            string memory,
            string memory,
            bool
        )
    {
        HealthcareProvider memory provider = healthcareProviders[providerAddress];
        return (
            provider.providerAddress,
            provider.name,
            provider.clinicName,
            provider.licenseNumber,
            provider.isVerified
        );
    }
}
