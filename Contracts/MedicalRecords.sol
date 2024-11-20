// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./AccessControl.sol";

contract MedicalRecords {
    AccessControl public accessControl;

    constructor(address accessControlAddress) {
        accessControl = AccessControl(accessControlAddress);
    }

    struct MedicalRecord {
        address patientAddress;
        address uploadedBy;
        string cid;
        uint256 timestamp;
    }

    mapping(address => MedicalRecord[]) public patientRecords;

    event MedicalRecordUploaded(
        address indexed patient,
        address indexed uploadedBy,
        string cid
    );

    // Function to upload a medical record
    function uploadMedicalRecord(address patientAddress, string calldata cid)
        external
    {
        require(
            accessControl.checkAccess(patientAddress, msg.sender),
            "Access not granted."
        );

        patientRecords[patientAddress].push(
            MedicalRecord({
                patientAddress: patientAddress,
                uploadedBy: msg.sender,
                cid: cid,
                timestamp: block.timestamp
            })
        );

        emit MedicalRecordUploaded(patientAddress, msg.sender, cid);
    }

    // Function to retrieve medical records
    function getMedicalRecords(address patientAddress)
        external
        view
        returns (MedicalRecord[] memory)
    {
        require(
            msg.sender == patientAddress ||
                accessControl.checkAccess(patientAddress, msg.sender),
            "Access not granted."
        );

        return patientRecords[patientAddress];
    }
}
