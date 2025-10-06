export type SectionItem = {
  key: "Log Out" | "Security & Privacy" | "Enable Biometrics" | "App Version" | string;
  value?: string;
  onPress: () => void;
};

export type Section = {
  title: string;
  data: SectionItem[];
};
