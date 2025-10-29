import Head from 'next/head'
import FlowBuilder from '../components/builder/FlowBuilder'

export default function Home() {
  return (
    <>
      <Head>
        <title>Visual Flow Builder - Interactive Video Campaign Builder</title>
        <meta name="description" content="Build interactive video campaigns with ease" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <FlowBuilder />
    </>
  )
}
