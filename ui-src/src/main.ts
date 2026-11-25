import { mount } from 'svelte'
import '../node_modules/m3-svelte/package/etc/styles.css'
import './app.css'
import './i18n'
import App from './App.svelte'

const app = mount(App, {
  target: document.getElementById('app')!,
})

export default app
