import moment from 'moment-timezone';

interface Section {
  title: string;
  data: Array<any>;
}

export const groupMessagesByDate = (messages: any) => {
  const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  return messages.reduce((groups: any, message: any) => {
    const dateKey = moment(new Date(message.createdAt).getTime())
      .tz(userTimeZone) 
      .startOf('day')
      .format('YYYY-MM-DD');
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(message);
    return groups;
  }, {});
};

export const createSections = (messages: any) => {
  const groupedMessages = groupMessagesByDate(messages);
  
  let sections = Object.keys(groupedMessages).map((dateKey) => ({
    title: dateKey,
    data: groupedMessages[dateKey].slice().reverse(),
  }));
  
  sections.sort((a, b) => moment(b.title).diff(moment(a.title)));
  
  console.log('Sections:', sections);

  return sections;
};


export const getChatSection = (sections: Section[], chatId: string): Section[] => {
  return sections
    .filter((section) => section.title.includes(chatId))
    .map(({ title, data }) => ({ title, data }));
};
