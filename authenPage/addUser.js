const dynamodb = require('../dynamodb');

module.exports.addUser = async (event, context) => {
// module.exports.addUser = (event, context) => {

    console.log(event);

    // let date = new Date();

    const tableName = process.env.DYNAMODB_TABLE;
    // const region = process.env.REGION;
    // const defaultAvi = 'https://YOUR/DEFAULT/IMAGE';
  
    console.log("table=" + tableName);
  
    // console.log("table=" + tableName + " -- region=" + region);

    // aws.config.update({region: region});

    // If the required parameters are present, proceed
    if (event.request.userAttributes.sub) {

        // -- Write data to DDB
        let params = {
            TableName: tableName,
            Item: {
                PK : "user_"+event.request.userAttributes.sub,
                SK : "profile_"+event.userName,
                email : event.request.userAttributes.email
            }
        };
        // dynamodb.putItem(params, function(err, data) {
        //     if (err) console.log(err, err.stack); // an error occurred
        //     else     console.log(data);           // successful response
        // });

        // Call DynamoDB
        try {
            await dynamodb.put(params).promise();
            console.log("Success");
        } catch (err) {
            console.log("Error", err);
        }

        console.log("Success: Everything executed correctly");
        context.done(null, event);

    } else {
        // Nothing to do, the user's email ID is unknown
        console.log("Error: Nothing was written to DDB or SQS");
        context.done(null, event);
    }
};