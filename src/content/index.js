const pageModules = import.meta.glob('./pages/*.md', { query: '?raw', import: 'default', eager: true })
const postModules = import.meta.glob('./posts/*.md', { query: '?raw', import: 'default', eager: true })

export const content = {}

for (const path in pageModules) {
  const moduleName = path.replace('./pages/', '').replace('.md', '')
  content[`/${moduleName}`] = pageModules[path]
}

for (const path in postModules) {
  const moduleName = path.replace('./posts/', '').replace('.md', '')
  content[`/posts/${moduleName}`] = postModules[path]
}
