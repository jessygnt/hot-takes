const Sauce = require('../models/Sauce');

const fs = require('fs');

exports.allSauce = (req, res, next) => {
    Sauce.find()
        .then(sauces => res.status(200).json(sauces))
        .catch(error => res.status(400).json({ error }));
};

exports.oneSauce = (req, res, next) => {
    Sauce.findOne({ _id: req.params.id })
        .then(sauce => res.status(200).json(sauce))
        .catch(error => res.status(404).json({ error }));
}

exports.createSauce = (req, res, next) => {
    const sauceObject = JSON.parse(req.body.sauce);
    const sauce = new Sauce({
        ...sauceObject,
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`,
        likes: 0,
        dislikes: 0,
        usersLiked: [],
        usersDisliked: []
    });
    sauce.save()
        .then(() => res.status(201).json({ message: 'Sauce enregistrer !' }))
        .catch(error => res.status(400).json({ error }));
};

exports.updateSauce = (req, res, next) => {
    const sauceObject = req.file ? {
        ...JSON.parse(req.body.sauce),
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
    } : { ...req.body }

    Sauce.updateOne({ _id: req.params.id }, { ...sauceObject, _id: req.params.id })
        .then(() => res.status(201).json({ message: 'Sauce modifier' }))
        .catch(error => res.status(400).json({ error }));
};

exports.deleteSauce = (req, res, next) => {
    Sauce.findOne({ _id: req.params.id })
        .then(sauce => {
            if (sauce.userId != req.auth.userId) {
                res.status(401).json({ message: 'Not authorized' });
            } else {
                const filename = sauce.imageUrl.split('/images/')[1];
                fs.unlink(`images/${filename}`, () => {
                    Sauce.deleteOne({ _id: req.params.id })
                        .then(() => res.status(200).json({ message: 'Objet supprimé !' }))
                        .catch(error => res.status(401).json({ error }));
                });
            }
        })
        .catch(error => res.status(500).json({ error }));
};

exports.likeSauce = (req, res, next) => {
    Sauce.findOne({ _id: req.params.id })
        .then(sauce => {
            if (req.body.like === 1 && !sauce.usersLiked.includes(req.body.userId)) {
                sauce.usersLiked.push(req.body.userId);
                sauce.likes += 1;
            } else if (req.body.like === -1 && !sauce.usersDisliked.includes(req.body.userId)) {
                sauce.usersDisliked.push(req.body.userId);
                sauce.dislikes += 1;
            } else {
                req.body.like = 0;
                if (sauce.usersLiked.includes(req.body.userId)) {
                    sauce.usersLiked.remove(req.body.userId);
                    sauce.likes += -1;
                }
                if (sauce.usersDisliked.includes(req.body.userId)) {
                    sauce.usersDisliked.remove(req.body.userId);
                    sauce.dislikes += -1
                }
            }
            Sauce.updateOne({ _id: req.params.id }, sauce)
                .then(sauce => res.status(201).json(sauce))
                .catch(error => res.status(400).json({ error }));
        })
        .catch(error => res.status(500).json({ error }));
};