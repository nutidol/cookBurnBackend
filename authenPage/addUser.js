const ddb = require('../dynamodb');

module.exports.addUser = async (event, context) => {
    console.log(event);

    let date = new Date();

    const tableName = process.env.TABLE_NAME;
    const region = process.env.REGION;
    const defaultAvi = 'https://YOUR/DEFAULT/IMAGE';
    
    console.log("table=" + tableName + " -- region=" + region);

    aws.config.update({region: region});

    // If the required parameters are present, proceed
    if (event.request.userAttributes.sub) {

        // -- Write data to DDB
        let ddbParams = {
            Item: {
                'id': {S: event.request.userAttributes.sub},
                '__typename': {S: 'User'},
                'picture': {S: defaultAvi},
                'username': {S: event.userName},
                'name': {S: event.request.userAttributes.name},
                'skillLevel': {N: '0'},
                'email': {S: event.request.userAttributes.email},
                'createdAt': {S: date.toISOString()},
            },
            TableName: tableName
        };

        // Call DynamoDB
        try {
            await ddb.putItem(ddbParams).promise()
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