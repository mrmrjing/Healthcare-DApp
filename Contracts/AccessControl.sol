// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./PatientRegistry.sol";
import "./HealthcareProviderRegistry.sol";

contract AccessControl {
    PatientRegistry public patientRegistry;
    HealthcareProviderRegistry public providerRegistry;

    constructor(address patientRegistryAddress, address providerRegistryAddress) {
        patientRegistry = PatientRegistry(patientRegistryAddress);
        providerRegistry = HealthcareProviderRegistry(providerRegistryAddress);
    }

    struct AccessRequest {
        address patientAddress;
        address providerAddress;
        uint256 timestamp;
        string purpose;
        bool isApproved;
    }

    mapping(address => mapping(address => AccessRequest)) public accessRequests;
    mapping(address => address[]) public patientToProviders;
    mapping(address => address[]) public providerToPatients;

    event AccessRequested(address indexed patient, address indexed provider);
    event AccessApproved(address indexed patient, address indexed provider);
    event AccessRevoked(address indexed patient, address indexed provider);

    // Function for providers to request access to a patient's records
    function requestAccess(address patientAddress, string calldata purpose) external {
        require(
            providerRegistry.isProviderVerified(msg.sender),
            "Provider not verified."
        );
        require(
            patientRegistry.isPatientRegistered(patientAddress),
            "Patient not registered."
        );

        accessRequests[patientAddress][msg.sender] = AccessRequest({
            patientAddress: patientAddress,
            providerAddress: msg.sender,
            timestamp: block.timestamp,
            purpose: purpose,
            isApproved: false
        });

        emit AccessRequested(patientAddress, msg.sender);
    }

    // Function for patients to approve access requests
    function approveAccess(address providerAddress) external {
        require(
            accessRequests[msg.sender][providerAddress].providerAddress != address(0),
            "No access request found."
        );

        accessRequests[msg.sender][providerAddress].isApproved = true;
        patientToProviders[msg.sender].push(providerAddress);
        providerToPatients[providerAddress].push(msg.sender);

        emit AccessApproved(msg.sender, providerAddress);
    }

    // Function for patients to revoke access
    function revokeAccess(address providerAddress) external {
        require(
            accessRequests[msg.sender][providerAddress].isApproved,
            "Access not granted."
        );

        accessRequests[msg.sender][providerAddress].isApproved = false;

        // Remove provider from patientToProviders
        removeProvider(msg.sender, providerAddress);
        // Remove patient from providerToPatients
        removePatient(providerAddress, msg.sender);

        emit AccessRevoked(msg.sender, providerAddress);
    }

    // Function to check if access is granted
    function checkAccess(address patientAddress, address providerAddress)
        public
        view
        returns (bool)
    {
        return accessRequests[patientAddress][providerAddress].isApproved;
    }

    // Internal function to remove a provider from a patient's list
    function removeProvider(address patientAddress, address providerAddress)
        internal
    {
        address[] storage providers = patientToProviders[patientAddress];
        for (uint256 i = 0; i < providers.length; i++) {
            if (providers[i] == providerAddress) {
                providers[i] = providers[providers.length - 1];
                providers.pop();
                break;
            }
        }
    }

    // Internal function to remove a patient from a provider's list
    function removePatient(address providerAddress, address patientAddress)
        internal
    {
        address[] storage patients = providerToPatients[providerAddress];
        for (uint256 i = 0; i < patients.length; i++) {
            if (patients[i] == patientAddress) {
                patients[i] = patients[patients.length - 1];
                patients.pop();
                break;
            }
        }
    }
}
