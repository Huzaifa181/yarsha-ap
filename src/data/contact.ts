import { Images } from "@/theme";
import { ImageSourcePropType } from "react-native";

export type Contact = {
  id: string;
  name: string;
  address: string;
  image: ImageSourcePropType;
};

export type ContactSection = {
  title: string;
  data: Contact[];
};

export type ContactListData = ContactSection[];

export const CONTACTS_DATA: ContactListData = [
  {
    title: "A",
    data: [
      {
        id: "1",
        name: "Aethernaut",
        address: "0x1a5F7e3D......153d1439152C38b38259593",
        image: Images.mask,
      },
      {
        id: "2",
        name: "AltcoinAlice",
        address: "0x2a5F7e3D......153d1439152C38b38259593",
        image: Images.mask1,
      },
      {
        id: "3",
        name: "AvalancheAndy",
        address: "0x3a5F7e3D......153d1439152C38b38259593",
        image: Images.mask2,
      },
      {
        id: "4",
        name: "ArbitrumAmy",
        address: "0x4a5F7e3D......153d1439152C38b38259593",
        image: Images.mask3,
      },
      {
        id: "5",
        name: "ApeAaron",
        address: "0x5a5F7e3D......153d1439152C38b38259593",
        image: Images.mask4,
      },
      {
        id: "6",
        name: "AxieAlex",
        address: "0x6a5F7e3D......153d1439152C38b38259593",
        image: Images.mask5,
      },
      {
        id: "7",
        name: "AaveAnna",
        address: "0x7a5F7e3D......153d1439152C38b38259593",
        image: Images.mask6,
      },
      {
        id: "8",
        name: "AlgorandAlan",
        address: "0x8a5F7e3D......153d1439152C38b38259593",
        image: Images.mask,
      },
      {
        id: "9",
        name: "AnkrAmy",
        address: "0x9a5F7e3D......153d1439152C38b38259593",
        image: Images.mask1,
      },
      {
        id: "10",
        name: "ArdorArt",
        address: "0xAa5F7e3D......153d1439152C38b38259593",
        image: Images.mask2,
      },
      {
        id: "11",
        name: "AcalaApril",
        address: "0xBa5F7e3D......153d1439152C38b38259593",
        image: Images.mask3,
      },
      {
        id: "12",
        name: "AragonAlice",
        address: "0xCa5F7e3D......153d1439152C38b38259593",
        image: Images.mask4,
      },
      {
        id: "13",
        name: "AudiusAdam",
        address: "0xDa5F7e3D......153d1439152C38b38259593",
        image: Images.mask5,
      },
      {
        id: "14",
        name: "AionAva",
        address: "0xEa5F7e3D......153d1439152C38b38259593",
        image: Images.mask6,
      },
      {
        id: "15",
        name: "AeternityAsh",
        address: "0xFa5F7e3D......153d1439152C38b38259593",
        image: Images.mask,
      },
    ],
  },
  {
    title: "B",
    data: [
      {
        id: "16",
        name: "BlockchainBob",
        address: "0x1b5F7e3D......153d1439152C38b38259593",
        image: Images.mask1,
      },
      {
        id: "17",
        name: "BitBoyBen",
        address: "0x2b5F7e3D......153d1439152C38b38259593",
        image: Images.mask2,
      },
      {
        id: "18",
        name: "BinanceBill",
        address: "0x3b5F7e3D......153d1439152C38b38259593",
        image: Images.mask3,
      },
      {
        id: "19",
        name: "BitcoinBart",
        address: "0x4b5F7e3D......153d1439152C38b38259593",
        image: Images.mask4,
      },
      {
        id: "20",
        name: "BalancerBen",
        address: "0x5b5F7e3D......153d1439152C38b38259593",
        image: Images.mask5,
      },
      {
        id: "21",
        name: "BasicBetty",
        address: "0x6b5F7e3D......153d1439152C38b38259593",
        image: Images.mask6,
      },
      {
        id: "22",
        name: "BancorBrian",
        address: "0x7b5F7e3D......153d1439152C38b38259593",
        image: Images.mask,
      },
      {
        id: "23",
        name: "BeamBella",
        address: "0x8b5F7e3D......153d1439152C38b38259593",
        image: Images.mask1,
      },
      {
        id: "24",
        name: "BifrostBlake",
        address: "0x9b5F7e3D......153d1439152C38b38259593",
        image: Images.mask2,
      },
      {
        id: "25",
        name: "BluzelleBryan",
        address: "0xAb5F7e3D......153d1439152C38b38259593",
        image: Images.mask3,
      },
      {
        id: "26",
        name: "BandBenny",
        address: "0xBb5F7e3D......153d1439152C38b38259593",
        image: Images.mask4,
      },
      {
        id: "27",
        name: "BittorrentBecky",
        address: "0xCb5F7e3D......153d1439152C38b38259593",
        image: Images.mask5,
      },
      {
        id: "28",
        name: "BonfidaBill",
        address: "0xDb5F7e3D......153d1439152C38b38259593",
        image: Images.mask6,
      },
      {
        id: "29",
        name: "BoringBrad",
        address: "0xEb5F7e3D......153d1439152C38b38259593",
        image: Images.mask,
      },
      {
        id: "30",
        name: "BoraBella",
        address: "0xFb5F7e3D......153d1439152C38b38259593",
        image: Images.mask1,
      },
    ],
  },
  {
    title: "C",
    data: [
      {
        id: "31",
        name: "CryptoChris",
        address: "0x1c5F7e3D......153d1439152C38b38259593",
        image: Images.mask2,
      },
      {
        id: "32",
        name: "CoinbaseCathy",
        address: "0x2c5F7e3D......153d1439152C38b38259593",
        image: Images.mask3,
      },
      {
        id: "33",
        name: "CardanoCarl",
        address: "0x3c5F7e3D......153d1439152C38b38259593",
        image: Images.mask4,
      },
      {
        id: "34",
        name: "ChainlinkCharlie",
        address: "0x4c5F7e3D......153d1439152C38b38259593",
        image: Images.mask5,
      },
      {
        id: "35",
        name: "CeloCameron",
        address: "0x5c5F7e3D......153d1439152C38b38259593",
        image: Images.mask6,
      },
      {
        id: "36",
        name: "CompoundCasey",
        address: "0x6c5F7e3D......153d1439152C38b38259593",
        image: Images.mask,
      },
      {
        id: "37",
        name: "CosmosChris",
        address: "0x7c5F7e3D......153d1439152C38b38259593",
        image: Images.mask1,
      },
      {
        id: "38",
        name: "CivicCora",
        address: "0x8c5F7e3D......153d1439152C38b38259593",
        image: Images.mask2,
      },
      {
        id: "39",
        name: "CurveColin",
        address: "0x9c5F7e3D......153d1439152C38b38259593",
        image: Images.mask3,
      },
      {
        id: "40",
        name: "ChilizChris",
        address: "0xAc5F7e3D......153d1439152C38b38259593",
        image: Images.mask4,
      },
      {
        id: "41",
        name: "CloverClara",
        address: "0xBc5F7e3D......153d1439152C38b38259593",
        image: Images.mask5,
      },
      {
        id: "42",
        name: "ChromiaChuck",
        address: "0xCc5F7e3D......153d1439152C38b38259593",
        image: Images.mask6,
      },
      {
        id: "43",
        name: "CartesiCleo",
        address: "0xDc5F7e3D......153d1439152C38b38259593",
        image: Images.mask,
      },
      {
        id: "44",
        name: "CortexCurt",
        address: "0xEc5F7e3D......153d1439152C38b38259593",
        image: Images.mask1,
      },
      {
        id: "45",
        name: "CeloCody",
        address: "0xFc5F7e3D......153d1439152C38b38259593",
        image: Images.mask2,
      },
    ],
  },
  {
    title: "D",
    data: [
      {
        id: "46",
        name: "DaiDave",
        address: "0x1d5F7e3D......153d1439152C38b38259593",
        image: Images.mask3,
      },
      {
        id: "47",
        name: "DashDana",
        address: "0x2d5F7e3D......153d1439152C38b38259593",
        image: Images.mask4,
      },
      {
        id: "48",
        name: "DecentralandDiana",
        address: "0x3d5F7e3D......153d1439152C38b38259593",
        image: Images.mask5,
      },
      {
        id: "49",
        name: "DigiByteDylan",
        address: "0x4d5F7e3D......153d1439152C38b38259593",
        image: Images.mask6,
      },
      {
        id: "50",
        name: "DogecoinDuke",
        address: "0x5d5F7e3D......153d1439152C38b38259593",
        image: Images.mask,
      },
      {
        id: "51",
        name: "DODODominic",
        address: "0x6d5F7e3D......153d1439152C38b38259593",
        image: Images.mask1,
      },
      {
        id: "52",
        name: "DerivaDexDina",
        address: "0x7d5F7e3D......153d1439152C38b38259593",
        image: Images.mask2,
      },
      {
        id: "53",
        name: "DeFiDave",
        address: "0x8d5F7e3D......153d1439152C38b38259593",
        image: Images.mask3,
      },
      {
        id: "54",
        name: "DuskDylan",
        address: "0x9d5F7e3D......153d1439152C38b38259593",
        image: Images.mask4,
      },
      {
        id: "55",
        name: "DharmaDanny",
        address: "0xAd5F7e3D......153d1439152C38b38259593",
        image: Images.mask5,
      },
      {
        id: "56",
        name: "DODODiana",
        address: "0xBd5F7e3D......153d1439152C38b38259593",
        image: Images.mask6,
      },
      {
        id: "57",
        name: "DIADaniel",
        address: "0xCd5F7e3D......153d1439152C38b38259593",
        image: Images.mask,
      },
      {
        id: "58",
        name: "DegoDerek",
        address: "0xDd5F7e3D......153d1439152C38b38259593",
        image: Images.mask1,
      },
      {
        id: "59",
        name: "DeXeDana",
        address: "0xEd5F7e3D......153d1439152C38b38259593",
        image: Images.mask2,
      },
      {
        id: "60",
        name: "DIADevin",
        address: "0xFd5F7e3D......153d1439152C38b38259593",
        image: Images.mask3,
      },
    ],
  },
  {
    title: "E",
    data: [
      {
        id: "101",
        name: "EthereumEvan",
        address: "0x1e5F7e3D......153d1439152C38b38259593",
        image: Images.mask,
      },
      {
        id: "102",
        name: "EOSEmma",
        address: "0x2e5F7e3D......153d1439152C38b38259593",
        image: Images.mask1,
      },
      {
        id: "103",
        name: "ElrondElla",
        address: "0x3e5F7e3D......153d1439152C38b38259593",
        image: Images.mask2,
      },
      {
        id: "104",
        name: "EnjinEric",
        address: "0x4e5F7e3D......153d1439152C38b38259593",
        image: Images.mask3,
      },
      {
        id: "105",
        name: "ErgoErin",
        address: "0x5e5F7e3D......153d1439152C38b38259593",
        image: Images.mask4,
      },
      {
        id: "106",
        name: "EthereumClassicEli",
        address: "0x6e5F7e3D......153d1439152C38b38259593",
        image: Images.mask5,
      },
      {
        id: "107",
        name: "EternityEmma",
        address: "0x7e5F7e3D......153d1439152C38b38259593",
        image: Images.mask6,
      },
      {
        id: "108",
        name: "EdgeElliot",
        address: "0x8e5F7e3D......153d1439152C38b38259593",
        image: Images.mask,
      },
      {
        id: "109",
        name: "EosfinexEve",
        address: "0x9e5F7e3D......153d1439152C38b38259593",
        image: Images.mask1,
      },
      {
        id: "110",
        name: "EnergiEli",
        address: "0xAe5F7e3D......153d1439152C38b38259593",
        image: Images.mask2,
      },
    ],
  },
  {
    title: "F",
    data: [
      {
        id: "201",
        name: "FantomFred",
        address: "0x1f5F7e3D......153d1439152C38b38259593",
        image: Images.mask,
      },
      {
        id: "202",
        name: "FilecoinFaye",
        address: "0x2f5F7e3D......153d1439152C38b38259593",
        image: Images.mask1,
      },
      {
        id: "203",
        name: "FlowFiona",
        address: "0x3f5F7e3D......153d1439152C38b38259593",
        image: Images.mask2,
      },
      {
        id: "204",
        name: "Fetch.aiFelix",
        address: "0x4f5F7e3D......153d1439152C38b38259593",
        image: Images.mask3,
      },
      {
        id: "205",
        name: "FiroFaith",
        address: "0x5f5F7e3D......153d1439152C38b38259593",
        image: Images.mask4,
      },
      {
        id: "206",
        name: "FlexaFrank",
        address: "0x6f5F7e3D......153d1439152C38b38259593",
        image: Images.mask5,
      },
      {
        id: "207",
        name: "FraxFlorence",
        address: "0x7f5F7e3D......153d1439152C38b38259593",
        image: Images.mask6,
      },
      {
        id: "208",
        name: "FantomOperaFin",
        address: "0x8f5F7e3D......153d1439152C38b38259593",
        image: Images.mask,
      },
      {
        id: "209",
        name: "FeiProtocolFay",
        address: "0x9f5F7e3D......153d1439152C38b38259593",
        image: Images.mask1,
      },
      {
        id: "210",
        name: "FusionFiona",
        address: "0xAf5F7e3D......153d1439152C38b38259593",
        image: Images.mask2,
      },
    ],
  },
  {
    title: "G",
    data: [
      {
        id: "301",
        name: "GnosisGrace",
        address: "0x1g7F7e3D......153d1439152C38b38259593",
        image: Images.mask,
      },
      {
        id: "302",
        name: "GitcoinGrant",
        address: "0x2g7F7e3D......153d1439152C38b38259593",
        image: Images.mask1,
      },
      {
        id: "303",
        name: "GolemGreg",
        address: "0x3g7F7e3D......153d1439152C38b38259593",
        image: Images.mask2,
      },
      {
        id: "304",
        name: "GasTokenGary",
        address: "0x4g7F7e3D......153d1439152C38b38259593",
        image: Images.mask3,
      },
      {
        id: "305",
        name: "GeminiGeorge",
        address: "0x5g7F7e3D......153d1439152C38b38259593",
        image: Images.mask4,
      },
    ],
  },
  {
    title: "H",
    data: [
      {
        id: "401",
        name: "HederaHarry",
        address: "0x1h8F7e3D......153d1439152C38b38259593",
        image: Images.mask5,
      },
      {
        id: "402",
        name: "HeliumHannah",
        address: "0x2h8F7e3D......153d1439152C38b38259593",
        image: Images.mask6,
      },
      {
        id: "403",
        name: "HoloHostHal",
        address: "0x3h8F7e3D......153d1439152C38b38259593",
        image: Images.mask,
      },
      {
        id: "404",
        name: "HydroHilda",
        address: "0x4h8F7e3D......153d1439152C38b38259593",
        image: Images.mask1,
      },
      {
        id: "405",
        name: "HarmonyHank",
        address: "0x5h8F7e3D......153d1439152C38b38259593",
        image: Images.mask2,
      },
    ],
  },
  {
    title: "I",
    data: [
      {
        id: "501",
        name: "ICONIvy",
        address: "0x1i9F7e3D......153d1439152C38b38259593",
        image: Images.mask3,
      },
      {
        id: "502",
        name: "InjectiveIris",
        address: "0x2i9F7e3D......153d1439152C38b38259593",
        image: Images.mask4,
      },
      {
        id: "503",
        name: "IOTAIan",
        address: "0x3i9F7e3D......153d1439152C38b38259593",
        image: Images.mask5,
      },
      {
        id: "504",
        name: "ImmutableIsaac",
        address: "0x4i9F7e3D......153d1439152C38b38259593",
        image: Images.mask6,
      },
      {
        id: "505",
        name: "IoTeXIvy",
        address: "0x5i9F7e3D......153d1439152C38b38259593",
        image: Images.mask,
      },
    ],
  },
  {
    title: "J",
    data: [
      {
        id: "601",
        name: "JuiceboxJack",
        address: "0x1j1F7e3D......153d1439152C38b38259593",
        image: Images.mask1,
      },
      {
        id: "602",
        name: "JunoJoy",
        address: "0x2j1F7e3D......153d1439152C38b38259593",
        image: Images.mask2,
      },
      {
        id: "603",
        name: "JustJade",
        address: "0x3j1F7e3D......153d1439152C38b38259593",
        image: Images.mask3,
      },
      {
        id: "604",
        name: "JupiterJulia",
        address: "0x4j1F7e3D......153d1439152C38b38259593",
        image: Images.mask4,
      },
      {
        id: "605",
        name: "JasmyJay",
        address: "0x5j1F7e3D......153d1439152C38b38259593",
        image: Images.mask5,
      },
    ],
  },
  {
    title: "K",
    data: [
      {
        id: "701",
        name: "KyberKevin",
        address: "0x1k2F7e3D......153d1439152C38b38259593",
        image: Images.mask6,
      },
      {
        id: "702",
        name: "KavaKai",
        address: "0x2k2F7e3D......153d1439152C38b38259593",
        image: Images.mask,
      },
      {
        id: "703",
        name: "KusamaKane",
        address: "0x3k2F7e3D......153d1439152C38b38259593",
        image: Images.mask1,
      },
      {
        id: "704",
        name: "KeepKeyKaren",
        address: "0x4k2F7e3D......153d1439152C38b38259593",
        image: Images.mask2,
      },
      {
        id: "705",
        name: "KadenaKirk",
        address: "0x5k2F7e3D......153d1439152C38b38259593",
        image: Images.mask3,
      },
    ],
  },
  {
    title: "L",
    data: [
      {
        id: "801",
        name: "LoopringLily",
        address: "0x1l3F7e3D......153d1439152C38b38259593",
        image: Images.mask4,
      },
      {
        id: "802",
        name: "LiskLana",
        address: "0x2l3F7e3D......153d1439152C38b38259593",
        image: Images.mask5,
      },
      {
        id: "803",
        name: "LitecoinLeo",
        address: "0x3l3F7e3D......153d1439152C38b38259593",
        image: Images.mask6,
      },
      {
        id: "804",
        name: "LivepeerLuke",
        address: "0x4l3F7e3D......153d1439152C38b38259593",
        image: Images.mask,
      },
      {
        id: "805",
        name: "LoomLandry",
        address: "0x5l3F7e3D......153d1439152C38b38259593",
        image: Images.mask1,
      },
    ],
  },
  {
    title: "M",
    data: [
      {
        id: "901",
        name: "MoneroMason",
        address: "0x1m4F7e3D......153d1439152C38b38259593",
        image: Images.mask2,
      },
      {
        id: "902",
        name: "MakerMark",
        address: "0x2m4F7e3D......153d1439152C38b38259593",
        image: Images.mask3,
      },
      {
        id: "903",
        name: "MetaMaskMia",
        address: "0x3m4F7e3D......153d1439152C38b38259593",
        image: Images.mask4,
      },
      {
        id: "904",
        name: "MinaMichael",
        address: "0x4m4F7e3D......153d1439152C38b38259593",
        image: Images.mask5,
      },
      {
        id: "905",
        name: "MaticMax",
        address: "0x5m4F7e3D......153d1439152C38b38259593",
        image: Images.mask6,
      },
    ],
  },
  {
    title: "N",
    data: [
      {
        id: "1001",
        name: "NEONeil",
        address: "0x1n5F7e3D......153d1439152C38b38259593",
        image: Images.mask,
      },
      {
        id: "1002",
        name: "NEMNina",
        address: "0x2n5F7e3D......153d1439152C38b38259593",
        image: Images.mask1,
      },
      {
        id: "1003",
        name: "NanoNate",
        address: "0x3n5F7e3D......153d1439152C38b38259593",
        image: Images.mask2,
      },
      {
        id: "1004",
        name: "NexusNova",
        address: "0x4n5F7e3D......153d1439152C38b38259593",
        image: Images.mask3,
      },
      {
        id: "1005",
        name: "NashNico",
        address: "0x5n5F7e3D......153d1439152C38b38259593",
        image: Images.mask4,
      },
    ],
  },
  {
    title: "O",
    data: [
      {
        id: "1101",
        name: "OMGOswald",
        address: "0x1o6F7e3D......153d1439152C38b38259593",
        image: Images.mask5,
      },
      {
        id: "1102",
        name: "OntologyOllie",
        address: "0x2o6F7e3D......153d1439152C38b38259593",
        image: Images.mask6,
      },
      {
        id: "1103",
        name: "OrchidOwen",
        address: "0x3o6F7e3D......153d1439152C38b38259593",
        image: Images.mask,
      },
      {
        id: "1104",
        name: "OriginOlivia",
        address: "0x4o6F7e3D......153d1439152C38b38259593",
        image: Images.mask1,
      },
      {
        id: "1105",
        name: "OceanOtis",
        address: "0x5o6F7e3D......153d1439152C38b38259593",
        image: Images.mask2,
      },
    ],
  },
  {
    title: "P",
    data: [
      {
        id: "1201",
        name: "PolkadotPete",
        address: "0x1p7F7e3D......153d1439152C38b38259593",
        image: Images.mask3,
      },
      {
        id: "1202",
        name: "PundiXPaul",
        address: "0x2p7F7e3D......153d1439152C38b38259593",
        image: Images.mask4,
      },
      {
        id: "1203",
        name: "PowerLedgerPeyton",
        address: "0x3p7F7e3D......153d1439152C38b38259593",
        image: Images.mask5,
      },
      {
        id: "1204",
        name: "PancakeSwapPam",
        address: "0x4p7F7e3D......153d1439152C38b38259593",
        image: Images.mask6,
      },
      {
        id: "1205",
        name: "PolygonPerry",
        address: "0x5p7F7e3D......153d1439152C38b38259593",
        image: Images.mask,
      },
    ],
  },
  {
    title: "Q",
    data: [
      {
        id: "1301",
        name: "QtumQuincy",
        address: "0x1q8F7e3D......153d1439152C38b38259593",
        image: Images.mask1,
      },
      {
        id: "1302",
        name: "QuickSwapQuinn",
        address: "0x2q8F7e3D......153d1439152C38b38259593",
        image: Images.mask2,
      },
      {
        id: "1303",
        name: "QuarkChainQuinn",
        address: "0x3q8F7e3D......153d1439152C38b38259593",
        image: Images.mask3,
      },
      {
        id: "1304",
        name: "QredoQue",
        address: "0x4q8F7e3D......153d1439152C38b38259593",
        image: Images.mask4,
      },
      {
        id: "1305",
        name: "QlinkQadir",
        address: "0x5q8F7e3D......153d1439152C38b38259593",
        image: Images.mask5,
      },
    ],
  },
  {
    title: "R",
    data: [
      {
        id: "1401",
        name: "RippleRex",
        address: "0x1r9F7e3D......153d1439152C38b38259593",
        image: Images.mask6,
      },
      {
        id: "1402",
        name: "RavencoinRoy",
        address: "0x2r9F7e3D......153d1439152C38b38259593",
        image: Images.mask,
      },
      {
        id: "1403",
        name: "RenRudy",
        address: "0x3r9F7e3D......153d1439152C38b38259593",
        image: Images.mask1,
      },
      {
        id: "1404",
        name: "ReefReed",
        address: "0x4r9F7e3D......153d1439152C38b38259593",
        image: Images.mask2,
      },
      {
        id: "1405",
        name: "ReserveRightsRory",
        address: "0x5r9F7e3D......153d1439152C38b38259593",
        image: Images.mask3,
      },
    ],
  },
  {
    title: "S",
    data: [
      {
        id: "1501",
        name: "SolanaSam",
        address: "0x1s0F7e3D......153d1439152C38b38259593",
        image: Images.mask4,
      },
      {
        id: "1502",
        name: "StellarStacy",
        address: "0x2s0F7e3D......153d1439152C38b38259593",
        image: Images.mask5,
      },
      {
        id: "1503",
        name: "SushiSwapSue",
        address: "0x3s0F7e3D......153d1439152C38b38259593",
        image: Images.mask6,
      },
      {
        id: "1504",
        name: "ShibaInuShane",
        address: "0x4s0F7e3D......153d1439152C38b38259593",
        image: Images.mask,
      },
      {
        id: "1505",
        name: "SynthetixSydney",
        address: "0x5s0F7e3D......153d1439152C38b38259593",
        image: Images.mask1,
      },
    ],
  },
  {
    title: "T",
    data: [
      {
        id: "1601",
        name: "TezosTim",
        address: "0x1t1F7e3D......153d1439152C38b38259593",
        image: Images.mask2,
      },
      {
        id: "1602",
        name: "TronTravis",
        address: "0x2t1F7e3D......153d1439152C38b38259593",
        image: Images.mask3,
      },
      {
        id: "1603",
        name: "ThetaTheo",
        address: "0x3t1F7e3D......153d1439152C38b38259593",
        image: Images.mask4,
      },
      {
        id: "1604",
        name: "TetherTina",
        address: "0x4t1F7e3D......153d1439152C38b38259593",
        image: Images.mask5,
      },
      {
        id: "1605",
        name: "TrueUSDTony",
        address: "0x5t1F7e3D......153d1439152C38b38259593",
        image: Images.mask6,
      },
    ],
  },
  {
    title: "U",
    data: [
      {
        id: "1701",
        name: "UniswapUma",
        address: "0x1u2F7e3D......153d1439152C38b38259593",
        image: Images.mask,
      },
      {
        id: "1702",
        name: "USD CoinUri",
        address: "0x2u2F7e3D......153d1439152C38b38259593",
        image: Images.mask1,
      },
      {
        id: "1703",
        name: "UMAUriel",
        address: "0x3u2F7e3D......153d1439152C38b38259593",
        image: Images.mask2,
      },
      {
        id: "1704",
        name: "UpholdUrsula",
        address: "0x4u2F7e3D......153d1439152C38b38259593",
        image: Images.mask3,
      },
      {
        id: "1705",
        name: "UtrustUrs",
        address: "0x5u2F7e3D......153d1439152C38b38259593",
        image: Images.mask4,
      },
    ],
  },
  {
    title: "V",
    data: [
      {
        id: "1801",
        name: "VeChainVince",
        address: "0x1v3F7e3D......153d1439152C38b38259593",
        image: Images.mask5,
      },
      {
        id: "1802",
        name: "VergeVeronica",
        address: "0x2v3F7e3D......153d1439152C38b38259593",
        image: Images.mask6,
      },
      {
        id: "1803",
        name: "VoyagerVaughn",
        address: "0x3v3F7e3D......153d1439152C38b38259593",
        image: Images.mask,
      },
      {
        id: "1804",
        name: "VesperVera",
        address: "0x4v3F7e3D......153d1439152C38b38259593",
        image: Images.mask1,
      },
      {
        id: "1805",
        name: "VulcanForgedVicky",
        address: "0x5v3F7e3D......153d1439152C38b38259593",
        image: Images.mask2,
      },
    ],
  },
  {
    title: "W",
    data: [
      {
        id: "1901",
        name: "WavesWade",
        address: "0x1w4F7e3D......153d1439152C38b38259593",
        image: Images.mask3,
      },
      {
        id: "1902",
        name: "WanchainWanda",
        address: "0x2w4F7e3D......153d1439152C38b38259593",
        image: Images.mask4,
      },
      {
        id: "1903",
        name: "WrappedBitcoinWill",
        address: "0x3w4F7e3D......153d1439152C38b38259593",
        image: Images.mask5,
      },
      {
        id: "1904",
        name: "WinkLinkWinnie",
        address: "0x4w4F7e3D......153d1439152C38b38259593",
        image: Images.mask6,
      },
      {
        id: "1905",
        name: "WAXWilson",
        address: "0x5w4F7e3D......153d1439152C38b38259593",
        image: Images.mask,
      },
    ],
  },
  {
    title: "X",
    data: [
      {
        id: "2001",
        name: "XRPXander",
        address: "0x1x5F7e3D......153d1439152C38b38259593",
        image: Images.mask1,
      },
      {
        id: "2002",
        name: "XinFinXena",
        address: "0x2x5F7e3D......153d1439152C38b38259593",
        image: Images.mask2,
      },
      {
        id: "2003",
        name: "XDCNetworkXavi",
        address: "0x3x5F7e3D......153d1439152C38b38259593",
        image: Images.mask3,
      },
      {
        id: "2004",
        name: "XSGDXavier",
        address: "0x4x5F7e3D......153d1439152C38b38259593",
        image: Images.mask4,
      },
      {
        id: "2005",
        name: "XenonXander",
        address: "0x5x5F7e3D......153d1439152C38b38259593",
        image: Images.mask5,
      },
    ],
  },
  {
    title: "Y",
    data: [
      {
        id: "2101",
        name: "YearnFinanceYara",
        address: "0x1y6F7e3D......153d1439152C38b38259593",
        image: Images.mask6,
      },
      {
        id: "2102",
        name: "YieldGuildGamesYuri",
        address: "0x2y6F7e3D......153d1439152C38b38259593",
        image: Images.mask,
      },
      {
        id: "2103",
        name: "YAMFinanceYvette",
        address: "0x3y6F7e3D......153d1439152C38b38259593",
        image: Images.mask1,
      },
      {
        id: "2104",
        name: "YuanChainYves",
        address: "0x4y6F7e3D......153d1439152C38b38259593",
        image: Images.mask2,
      },
      {
        id: "2105",
        name: "YetiCoinYasmin",
        address: "0x5y6F7e3D......153d1439152C38b38259593",
        image: Images.mask3,
      },
    ],
  },
  {
    title: "Z",
    data: [
      {
        id: "381",
        name: "ZilliqaZane",
        address: "0x1z5F7e3D......153d1439152C38b38259593",
        image: Images.mask6,
      },
      {
        id: "382",
        name: "ZeroXZach",
        address: "0x2z5F7e3D......153d1439152C38b38259593",
        image: Images.mask,
      },
      {
        id: "383",
        name: "ZcashZoe",
        address: "0x3z5F7e3D......153d1439152C38b38259593",
        image: Images.mask1,
      },
      {
        id: "384",
        name: "ZKSwapZara",
        address: "0x4z5F7e3D......153d1439152C38b38259593",
        image: Images.mask2,
      },
      {
        id: "385",
        name: "ZenonZeke",
        address: "0x5z5F7e3D......153d1439152C38b38259593",
        image: Images.mask3,
      },
      {
        id: "386",
        name: "ZilliqaZena",
        address: "0x6z5F7e3D......153d1439152C38b38259593",
        image: Images.mask4,
      },
      {
        id: "387",
        name: "ZeroXZoe",
        address: "0x7z5F7e3D......153d1439152C38b38259593",
        image: Images.mask5,
      },
      {
        id: "388",
        name: "ZcashZach",
        address: "0x8z5F7e3D......153d1439152C38b38259593",
        image: Images.mask6,
      },
      {
        id: "389",
        name: "ZKSwapZane",
        address: "0x9z5F7e3D......153d1439152C38b38259593",
        image: Images.mask,
      },
      {
        id: "390",
        name: "ZenonZara",
        address: "0xAz5F7e3D......153d1439152C38b38259593",
        image: Images.mask1,
      },
      {
        id: "391",
        name: "ZilliqaZeke",
        address: "0xBz5F7e3D......153d1439152C38b38259593",
        image: Images.mask2,
      },
      {
        id: "392",
        name: "ZeroXZane",
        address: "0xCz5F7e3D......153d1439152C38b38259593",
        image: Images.mask3,
      },
      {
        id: "393",
        name: "ZcashZena",
        address: "0xDz5F7e3D......153d1439152C38b38259593",
        image: Images.mask4,
      },
      {
        id: "394",
        name: "ZKSwapZach",
        address: "0xEz5F7e3D......153d1439152C38b38259593",
        image: Images.mask5,
      },
      {
        id: "395",
        name: "ZenonZoe",
        address: "0xFz5F7e3D......153d1439152C38b38259593",
        image: Images.mask6,
      },
    ],
  },
];
