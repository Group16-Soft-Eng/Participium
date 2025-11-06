
# Officer


## Properties

Name | Type
------------ | -------------
`id` | number
`name` | string
`surname` | string
`email` | string
`password` | string
`role` | [OfficerRole](OfficerRole.md)
`office` | [OfficeType](OfficeType.md)

## Example

```typescript
import type { Officer } from ''

// TODO: Update the object below with actual values
const example = {
  "id": null,
  "name": null,
  "surname": null,
  "email": null,
  "password": null,
  "role": null,
  "office": null,
} satisfies Officer

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as Officer
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


