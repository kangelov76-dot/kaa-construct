exports.handler = async () => {
  try {
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        tokenExists: !!process.env.NETLIFY_ACCESS_TOKEN,
        siteExists: !!process.env.NETLIFY_SITE_ID
      })
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: err.message
      })
    };
  }
};
