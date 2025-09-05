// Site configuration - replaces hugo.toml
export const siteConfig = {
  // Basic site info
  title: '@kalasoo',
  description: 'kalasoo\'s blog',
  baseURL: 'https://yinming.me',
  languageCode: 'zh-cn',
  
  // Analytics
  googleAnalytics: 'G-VGRZT9T626',
  
  // Author info
  author: {
    name: 'Yin Ming',
    wechat: 'kalasoo',
    email: 'ym.kalasoo@gmail.com',
    github: 'https://github.com/kalasoo',
    x: 'https://x.com/kalasoo',
    telegram: 'https://t.me/kalasoo',
    rss: 'https://yinming.me/rss.xml'
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
    }
  ],
  
  // Theme settings
  theme: {
    showDescription: false,
    isListGroupByDate: false
  }
}