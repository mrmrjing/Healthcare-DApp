import Web3 from 'web3';

const getWeb3 = () =>
  new Promise(async (resolve, reject) => {
    if (window.ethereum) {
      const web3 = new Web3(window.ethereum);
      try {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        resolve(web3);
      } catch (error) {
        reject(error);
      }
    } else {
      reject('Must install MetaMask');
    }
  });

export default getWeb3;
