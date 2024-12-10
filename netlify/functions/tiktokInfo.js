const axios = require('axios');

exports.handler = async function(event, context) {
  const { username } = event.queryStringParameters; // Ambil username dari query parameter

  if (!username) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Username is required' })
    };
  }

  try {
    const targetURL = `https://www.tiktok.com/@${username}`;
    const response = await axios.get(targetURL);
    const html = response.data;

    // Cari UID dari data yang ada di dalam script tertentu
    const scriptContent = html.match(/<script id="__UNIVERSAL_DATA_FOR_REHYDRATION__1"[^>]*>([\s\S]*?)<\/script>/);
    if (scriptContent && scriptContent[1]) {
      const jsonData = JSON.parse(scriptContent[1]);
      const uid = jsonData.__DEFAULT_SCOPE__?.['webapp.user-detail']?.userInfo.user;
      
      if (uid) {
        // Mengambil informasi creator dari API Tokopedia
        const apiURL = `https://oec22-normal-alisg.tokopediax.com/api/showcase/v1/creator_info/get?creator_uid=${uid.id}&aid=1988`;
        const apiResponse = await axios.get(apiURL);
        const apiData = apiResponse.data;

        if (apiData?.data?.data?.creator_info) {
          const creatorInfo = apiData.data.data.creator_info;
          return {
            statusCode: 200,
            body: JSON.stringify(creatorInfo)
          };
        } else {
          return {
            statusCode: 404,
            body: JSON.stringify({ error: 'No showcase information available for this account!' })
          };
        }
      } else {
        return {
          statusCode: 404,
          body: JSON.stringify({ error: 'UID not found in TikTok data' })
        };
      }
    } else {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Unable to find TikTok data for this username!' })
      };
    }
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to fetch data', message: error.message })
    };
  }
};
