// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract PatientRegistry {
    struct Patient {
        address patientAddress;
        string name;
        uint256 dateOfBirth;
        string gender;
        string[] medicalRecordCIDs;
    }

    mapping(address => Patient) private patients;

    // Function to register a new patient
    function registerPatient(
        string calldata name,
        uint256 dateOfBirth,
        string calldata gender
    ) external {
        require(
            patients[msg.sender].patientAddress == address(0),
            "Patient already registered."
        );

        patients[msg.sender] = Patient({
            patientAddress: msg.sender,
            name: name,
            dateOfBirth: dateOfBirth,
            gender: gender,
            medicalRecordCIDs: new string[](0) 
        });
    }

    // Function to update patient information
    function updatePatientInfo(
        string calldata name,
        uint256 dateOfBirth,
        string calldata gender
    ) external {
        require(
            patients[msg.sender].patientAddress != address(0),
            "Patient not registered."
        );

        Patient storage patient = patients[msg.sender];
        patient.name = name;
        patient.dateOfBirth = dateOfBirth;
        patient.gender = gender;
    }

    // Function to check if a patient is registered
    function isPatientRegistered(address patientAddress)
        external
        view
        returns (bool)
    {
        return patients[patientAddress].patientAddress != address(0);
    }

    // Function to retrieve patient information
    function getPatient(address patientAddress)
        external
        view
        returns (
            address,
            string memory,
            uint256,
            string memory,
            string[] memory
        )
    {
        Patient memory patient = patients[patientAddress];
        return (
            patient.patientAddress,
            patient.name,
            patient.dateOfBirth,
            patient.gender,
            patient.medicalRecordCIDs
        );
    }
}
