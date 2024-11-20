import React, { useState, useEffect } from 'react';
import Web3 from 'web3';

// Import compiled contract artifacts
import PatientRegistry from './contracts/PatientRegistry.json';
import HealthcareProviderRegistry from './contracts/HealthcareProviderRegistry.json';
import AccessControl from './contracts/AccessControl.json';
import MedicalRecords from './contracts/MedicalRecords.json';

function App() {
  // Web3 and account state
  const [web3, setWeb3] = useState(null);
  const [accounts, setAccounts] = useState([]);

  // Contract instances
  const [patientRegistry, setPatientRegistry] = useState(null);
  const [providerRegistry, setProviderRegistry] = useState(null);
  const [accessControl, setAccessControl] = useState(null);
  //const [medicalRecords, setMedicalRecords] = useState(null);

  // User role state
  const [isPatientRegistered, setIsPatientRegistered] = useState(false);
  const [isProviderRegistered, setIsProviderRegistered] = useState(false);

  // Form input state
  const [patientName, setPatientName] = useState('');
  const [patientDOB, setPatientDOB] = useState('');
  const [patientGender, setPatientGender] = useState('');
  const [providerName, setProviderName] = useState('');
  const [providerClinic, setProviderClinic] = useState('');
  const [providerLicense, setProviderLicense] = useState('');

  // Other state variables as needed

  useEffect(() => {
    const init = async () => {
      try {
        // Modern dapp browsers...
        if (window.ethereum) {
          const web3Instance = new Web3(window.ethereum);
          await window.ethereum.enable(); // Request account access
          setWeb3(web3Instance);

          // Get accounts
          const accounts = await web3Instance.eth.getAccounts();
          setAccounts(accounts);

          // Get network ID
          const networkId = await web3Instance.eth.net.getId();

          // Instantiate contracts
          const patientRegistryInstance = new web3Instance.eth.Contract(
            PatientRegistry.abi,
            PatientRegistry.networks[networkId] && PatientRegistry.networks[networkId].address,
          );
          setPatientRegistry(patientRegistryInstance);

          const providerRegistryInstance = new web3Instance.eth.Contract(
            HealthcareProviderRegistry.abi,
            HealthcareProviderRegistry.networks[networkId] &&
              HealthcareProviderRegistry.networks[networkId].address,
          );
          setProviderRegistry(providerRegistryInstance);

          const accessControlInstance = new web3Instance.eth.Contract(
            AccessControl.abi,
            AccessControl.networks[networkId] && AccessControl.networks[networkId].address,
          );
          setAccessControl(accessControlInstance);

          const medicalRecordsInstance = new web3Instance.eth.Contract(
            MedicalRecords.abi,
            MedicalRecords.networks[networkId] && MedicalRecords.networks[networkId].address,
          );
          setMedicalRecords(medicalRecordsInstance);

          // Check if the user is a registered patient
          const isPatient = await patientRegistryInstance.methods
            .isPatientRegistered(accounts[0])
            .call();
          setIsPatientRegistered(isPatient);

          // Check if the user is a verified provider
          const isProvider = await providerRegistryInstance.methods
            .isProviderVerified(accounts[0])
            .call();
          setIsProviderRegistered(isProvider);
        } else {
          // Non-dapp browsers...
          alert('Non-Ethereum browser detected. You should consider trying MetaMask!');
        }
      } catch (error) {
        console.error('Error initializing dapp:', error);
      }
    };

    init();
  }, []);

  // Patient registration function
  const registerPatient = async () => {
    try {
      await patientRegistry.methods
        .registerPatient(patientName, patientDOB, patientGender)
        .send({ from: accounts[0] });

      setIsPatientRegistered(true);
      alert('Patient registered successfully!');
    } catch (error) {
      console.error('Error registering patient:', error);
      alert('Registration failed.');
    }
  };

  // Provider registration function
  const registerProvider = async () => {
    try {
      await providerRegistry.methods
        .registerHealthcareProvider(providerName, providerClinic, providerLicense)
        .send({ from: accounts[0] });

      // Note: Verification by admin is required separately
      alert('Provider registered successfully! Awaiting verification.');
    } catch (error) {
      console.error('Error registering provider:', error);
      alert('Registration failed.');
    }
  };

  // Additional functions for interacting with contracts can be added here
  // For example: uploadMedicalRecord, requestAccess, approveAccess, etc.

  // Render different components based on user role
  return (
    <div>
      <h1>Healthcare DApp</h1>
      {isPatientRegistered ? (
        <div>
          <h2>Welcome, Patient</h2>
          {/* Patient dashboard components */}
          {/* For example, view medical records, approve access requests */}
        </div>
      ) : isProviderRegistered ? (
        <div>
          <h2>Welcome, Healthcare Provider</h2>
          {/* Provider dashboard components */}
          {/* For example, request access to patient records, upload records */}
        </div>
      ) : (
        <div>
          <h2>Please Register</h2>
          <div style={{ marginBottom: '20px' }}>
            <h3>Register as Patient</h3>
            <input
              type="text"
              placeholder="Name"
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
            />
            <input
              type="date"
              placeholder="Date of Birth"
              value={patientDOB}
              onChange={(e) => setPatientDOB(e.target.value)}
            />
            <input
              type="text"
              placeholder="Gender"
              value={patientGender}
              onChange={(e) => setPatientGender(e.target.value)}
            />
            <button onClick={registerPatient}>Register as Patient</button>
          </div>
          <div>
            <h3>Register as Healthcare Provider</h3>
            <input
              type="text"
              placeholder="Name"
              value={providerName}
              onChange={(e) => setProviderName(e.target.value)}
            />
            <input
              type="text"
              placeholder="Clinic Name"
              value={providerClinic}
              onChange={(e) => setProviderClinic(e.target.value)}
            />
            <input
              type="text"
              placeholder="License Number"
              value={providerLicense}
              onChange={(e) => setProviderLicense(e.target.value)}
            />
            <button onClick={registerProvider}>Register as Provider</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
