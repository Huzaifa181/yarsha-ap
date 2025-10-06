import Realm from 'realm';

export class PostalAddressModel extends Realm.Object<PostalAddressModel> {
  street!: string;
  city!: string;
  country!: string;
  region!: string;
  postCode!: string;
  label!: string;
  state!: string;

  static schema: Realm.ObjectSchema = {
    name: 'PostalAddressModel',
    properties: {
      street: 'string',
      city: 'string',
      country: 'string',
      region: 'string',
      postCode: 'string',
      label: 'string',
      state: 'string',
    },
  };
}

export class EmailAddressModel extends Realm.Object<EmailAddressModel> {
  email!: string;
  label!: string;

  static schema: Realm.ObjectSchema = {
    name: 'EmailAddressModel',
    properties: {
      email: 'string',
      label: 'string',
    },
  };
}

export class PhoneNumberModel extends Realm.Object<PhoneNumberModel> {
  number!: string;
  label!: string;

  static schema: Realm.ObjectSchema = {
    name: 'PhoneNumberModel',
    properties: {
      number: 'string',
      label: 'string',
    },
  };
}

export class UrlAddressModel extends Realm.Object<UrlAddressModel> {
  url!: string;
  label!: string;

  static schema: Realm.ObjectSchema = {
    name: 'UrlAddressModel',
    properties: {
      url: 'string',
      label: 'string',
    },
  };
}

export class BirthdayModel extends Realm.Object<BirthdayModel> {
  year?: number;
  month?: number;
  day?: number;

  static schema: Realm.ObjectSchema = {
    name: 'BirthdayModel',
    properties: {
      year: 'int?',
      month: 'int?',
      day: 'int?',
    },
  };
}

export class ContactModel extends Realm.Object<ContactModel> {
  recordID!: string;
  givenName!: string;
  middleName!: string;
  familyName!: string;
  jobTitle!: string;
  company!: string;
  hasThumbnail!: boolean;
  thumbnailPath!: string;

  postalAddresses!: Realm.List<PostalAddressModel>;
  emailAddresses!: Realm.List<EmailAddressModel>;
  phoneNumbers!: Realm.List<PhoneNumberModel>;
  urlAddresses!: Realm.List<UrlAddressModel>;
  birthday!: BirthdayModel | null;

  static schema: Realm.ObjectSchema = {
    name: 'ContactModel',
    primaryKey: 'recordID',
    properties: {
      recordID: 'string',
      givenName: 'string',
      middleName: 'string',
      familyName: 'string',
      jobTitle: 'string',
      company: 'string',
      hasThumbnail: 'bool',
      thumbnailPath: 'string',
      postalAddresses: {type: 'list', objectType: 'PostalAddressModel'},
      emailAddresses: {type: 'list', objectType: 'EmailAddressModel'},
      phoneNumbers: {type: 'list', objectType: 'PhoneNumberModel'},
      urlAddresses: {type: 'list', objectType: 'UrlAddressModel'},
      birthday: {type: 'object', objectType: 'BirthdayModel', optional: true},
    },
  };
}
