// Site configuration - replaces hugo.toml
export const siteConfig = {
  // Basic site info
  title: 'Ming Yin｜阴明｜@kalasoo',
  description: 'Personal blog exploring the intersection of technology and humanity',
  baseURL: 'https://yinming.me',
  languageCode: 'zh-cn',
  
  // Analytics
  googleAnalytics: 'G-VGRZT9T626',
  
  // Author info
  author: {
    name: 'Yin Ming',
    email: 'ym.kalasoo@gmail.com',
    github: 'https://github.com/kalasoo',
    twitter: 'https://x.com/kalasoo',
    telegram: 'https://t.me/kalasoo'
  },
  
  // Navigation menu
  menu: [
    {
      title: 'about',
      url: '/about'
    },
    {
      title: 'all posts',
      url: '/posts'
    },
    {
      title: 'subscribe',
      children: [
        {
          title: 'telegram',
          url: 'https://t.me/kalasoo_channel'
        },
        {
          title: 'rss',
          url: '/rss.xml'
        }
      ]
    }
  ],
  
  // Theme settings
  theme: {
    showDescription: false,
    isListGroupByDate: false
  }
}