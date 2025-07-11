// use std::hash::{DefaultHasher, Hash, Hasher};

// pub fn hash<T: Hash>(value: &T) -> String {
//     let mut hasher = DefaultHasher::new();
//     value.hash(&mut hasher);
//     hasher.finish().to_string()
// }

pub fn hash(value: &[u8]) -> String {
    blake3::hash(value).to_string()
}
