import {
  Box,
  Button,
  Center,
  Flex,
  Heading,
  Image,
  Input,
  SimpleGrid,
  Text,
} from '@chakra-ui/react';
import { Alchemy, Network } from 'alchemy-sdk';
import { useState } from 'react';
import { ethers } from 'ethers';
function App() {
  const [userAddress, setUserAddress] = useState('');
  const [results, setResults] = useState([]);
  const [hasQueried, setHasQueried] = useState(false);
  const [tokenDataObjects, setTokenDataObjects] = useState([]);
  const [walletAddress, setWalletAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [provider, setProvider] = useState(null);

  useState(() => {
    if (typeof window.ethereum !== 'undefined') {
      const ethProvider = new ethers.providers.Web3Provider(window.ethereum);
      setProvider(ethProvider);
    
    window.ethereum.on('accountsChanged', (accounts) => {
      if (accounts.length > 0) {
        setWalletAddress(accounts[0]);
        setUserAddress(accounts[0]);
      } else {
        setWalletAddress('');
        setUserAddress('');
      }
    });
    window.ethereum.on('chainChanged', () => {
      window.location.reload();
    });
    window.ethereum.on('disconnect', () => {
      setWalletAddress('');
      setUserAddress('');
    });
    // Set initial wallet address if available
  }
  }, []);

    async function handleConnectWallet() {
    if (!provider) {
      alert('Please install MetaMask to connect your wallet!');
      return;
    }

    try {
      const accounts = await provider.send('eth_requestAccounts', []);
      setWalletAddress(accounts[0]);
      setUserAddress(accounts[0]);
    } catch (error) {
      console.error('Error connecting to wallet:', error);
    }
  }
  async function getNFTsForOwner() {
    setIsLoading(true);
    const config = {
      apiKey: import.meta.env.VITE_ALCHEMY_API_KEY,
      network: Network.ETH_MAINNET,
    };

    const alchemy = new Alchemy(config);
    const data = await alchemy.nft.getNftsForOwner(userAddress);
    setResults(data);

    const tokenDataPromises = [];

    for (let i = 0; i < data.ownedNfts.length; i++) {
      const tokenData = alchemy.nft.getNftMetadata(
        data.ownedNfts[i].contract.address,
        data.ownedNfts[i].tokenId
      );
      tokenDataPromises.push(tokenData);
    }

    setTokenDataObjects(await Promise.all(tokenDataPromises));
    setHasQueried(true);
    setIsLoading(false);
  }
  return (
    <Box w="100vw">
      <Center>
        <Flex
          alignItems={'center'}
          justifyContent="center"
          flexDirection={'column'}
        >
          <Heading mb={0} fontSize={36}>
            NFT Indexer 🖼
          </Heading>
          <Text>
            Plug in an address and this website will return all of its NFTs!
          </Text>
        </Flex>
      </Center>
      <Flex
        w="100%"
        flexDirection="column"
        alignItems="center"
        justifyContent={'center'}
      > 
        <Heading mt={42}>Connect your wallet:</Heading>
                <Button
          onClick={handleConnectWallet}
          bgColor="blue"
          color="white"
          isDisabled={!provider}
        >
          {!provider 
            ? 'MetaMask Not Detected' 
            : walletAddress 
              ? `Connected: ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` 
              : 'Connect Wallet'
          }
        </Button>
        {walletAddress && (
          <Button 
            mt={8} 
            _hover={{ border: '1px solid white' }} 
            bgColor="rgba(225, 3, 3, 1)" 
            onClick={() => {
              setWalletAddress('');
              setUserAddress('');
            }}
          >
            Disconnect
          </Button>
        )}

        <Heading mt={42}>Get all the ERC-721 tokens of this address:</Heading>
        <Input
          onChange={(e) => setUserAddress(e.target.value)}
          color="black"
          w="600px"
          textAlign="center"
          p={4}
          bgColor="white"
          fontSize={24}
          placeholder={userAddress || '0x...'}
        />
        <Button fontSize={20} onClick={getNFTsForOwner} mt={36} bgColor="blue">
          {isLoading ? 'Loading...' : 'Query NFTs'}
        </Button>

        <Heading my={36}>Here are your NFTs:</Heading>

        {hasQueried ? (
          <SimpleGrid w={'90vw'} columns={4} spacing={24}>
            {results.ownedNfts.map((e, i) => {
              return (
                <Flex
                  flexDir={'column'}
                  color="white"
                  bg="blue"
                  w={'20vw'}
                  key={e.id}
                >
                  <Box>
                    <b>Name:</b>{' '}
                    {tokenDataObjects[i].title?.length === 0
                      ? 'No Name'
                      : tokenDataObjects[i].title}
                  </Box>
                  <Image
                    src={
                      tokenDataObjects[i]?.rawMetadata?.image ??
                      'https://via.placeholder.com/200'
                    }
                    alt={'Image'}
                  />
                </Flex>
              );
            })}
          </SimpleGrid>
        ) : (
          'Please make a query! The query may take a few seconds...'
        )}
      </Flex>
    </Box>
  );
}

export default App;
