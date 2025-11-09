import '../styles/globals.css'
import { AuthProvider } from '../contexts/AuthContext'
import VoiceAssistant from '../components/VoiceAssistant'

export default function App({ Component, pageProps }) {
  return (
    <AuthProvider>
      <Component {...pageProps} />
      <VoiceAssistant />
    </AuthProvider>
  )
}
