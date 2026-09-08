import Foundation
@main struct LocalizationTests {
 static func main() {
  let defaults=UserDefaults.standard
  let previous=defaults.object(forKey:"app.language")
  defer { if let previous {defaults.set(previous,forKey:"app.language")} else {defaults.removeObject(forKey:"app.language")} }
  defaults.set("ko",forKey:"app.language")
  precondition(L("홈")=="홈")
  precondition(L("{0}자","12")=="12자")
  defaults.set("en",forKey:"app.language")
  precondition(L("홈")=="Home")
  precondition(L("{0}자","12")=="12 characters")
  precondition(L("새 문서: {0}","notes/{1}.md")=="New document: notes/{1}.md", "User input must not be recursively substituted")
  let regex=try! NSRegularExpression(pattern:#"\{[0-9]+\}"#)
  func placeholders(_ s:String)->[String] {regex.matches(in:s,range:NSRange(s.startIndex...,in:s)).map{String(s[Range($0.range,in:s)!])}.sorted()}
  for (ko,en) in AppLanguage.english {precondition(!en.isEmpty);precondition(placeholders(ko)==placeholders(en),"Placeholder mismatch: "+ko)}
  precondition(!AppLanguage.english.values.contains(where:{$0.range(of:"[가-힣]",options:.regularExpression) != nil}))
  defaults.set("ko",forKey:"app.language")
  precondition(L("홈")=="홈")
  print("PASS: Korean/English switching, template coverage and literal user arguments;",AppLanguage.english.count,"translations")
 }
}
