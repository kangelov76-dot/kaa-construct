exports.handler = async () => {
  try {
    const token = process.env.NETLIFY_ACCESS_TOKEN;
    const formId = '6a21d06ef0e0010008a395a5';

    if (!token) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          success: false,
          error: 'Missing NETLIFY_ACCESS_TOKEN'
        })
      };
    }

    const response = await fetch(
      `https://api.netlify.com/api/v1/forms/${formId}/submissions`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    const submissions = await response.json();

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        count: Array.isArray(submissions) ? submissions.length : 0,
        submissions
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
