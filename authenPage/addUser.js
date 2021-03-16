const dynamodb = require('../dynamodb');

module.exports.addUser = async (event, context) => {

    console.log(event);

    const tableName = process.env.DYNAMODB_TABLE;

    console.log("table=" + tableName);

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